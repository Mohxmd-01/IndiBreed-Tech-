const bcrypt = require('bcryptjs');
const Device           = require('../models/Device');
const DeviceActivation = require('../models/DeviceActivation');
const User             = require('../models/User');
const { generateAlerts } = require('../services/alertGenerator');

// GET /api/devices
exports.getAll = async (req, res, next) => {
  try {
    const devices = await Device.find({ userId: req.user._id }).sort({ collarId: 1 });
    res.json({ devices, total: devices.length });
  } catch (err) { next(err); }
};

// POST /api/devices
exports.create = async (req, res, next) => {
  try {
    const { collarId, linkedCowId, clientId } = req.body;
    if (!collarId) return res.status(400).json({ error: 'collarId required.' });

    const existing = await Device.findOne({ userId: req.user._id, collarId });
    if (existing) return res.status(409).json({ error: 'Collar already registered.' });

    const device = await Device.create({
      userId: req.user._id, collarId, linkedCowId, clientId,
      battery: 100, signal: 90, status: 'online',
      temp: 38.5, activity: 60, lastSync: Date.now(),
    });
    res.status(201).json({ device });
  } catch (err) { next(err); }
};

// POST /api/devices/telemetry  — receive IoT readings (from simulator or real device)
exports.receiveTelemetry = async (req, res, next) => {
  try {
    const readings = Array.isArray(req.body) ? req.body : [req.body];

    for (const reading of readings) {
      const { collarId, temp, activity, battery, signal, status } = reading;
      const device = await Device.findOneAndUpdate(
        { userId: req.user._id, collarId },
        {
          temp, activity, battery, signal,
          status: status || (signal > 0 ? 'online' : 'offline'),
          lastSync: Date.now(),
          $push: {
            telemetry: {
              $each: [{ temp, activity, battery, timestamp: Date.now() }],
              $slice: -24,
            }
          }
        },
        { new: true }
      );

      if (device) {
        await generateAlerts(device, req.user._id);
      }
    }
    res.json({ ok: true, processed: readings.length });
  } catch (err) { next(err); }
};

// POST /api/devices/bulk-sync
exports.bulkSync = async (req, res, next) => {
  try {
    const { devices } = req.body;
    if (!Array.isArray(devices)) return res.status(400).json({ error: 'devices array required.' });

    for (const d of devices) {
      await Device.updateOne(
        { userId: req.user._id, collarId: d.collarId },
        { $setOnInsert: { ...d, userId: req.user._id } },
        { upsert: true }
      ).catch(() => {});
    }
    const all = await Device.find({ userId: req.user._id });
    res.json({ devices: all });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/devices/activate
// Validates collarId + activationCode, links device to user, appends deviceHistory.
// ─────────────────────────────────────────────────────────────────────────────
exports.activate = async (req, res, next) => {
  try {
    const { collarId, activationCode } = req.body;
    if (!collarId || !activationCode) {
      return res.status(400).json({ error: 'collarId and activationCode are required.' });
    }

    // Find activation record
    const activation = await DeviceActivation.findOne({ collarId: collarId.toUpperCase() });
    if (!activation) {
      return res.status(404).json({ error: 'Collar ID not found. Check the ID printed on your collar.' });
    }
    if (activation.isUsed) {
      return res.status(409).json({ error: 'This collar has already been activated. Contact support if this is an error.' });
    }

    // Validate code (bcrypt compare)
    const isValid = await bcrypt.compare(activationCode, activation.activationCode);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid activation code. Check the code on your packaging.' });
    }

    // Check rent expiry
    if (activation.productType === 'rent' && activation.rentExpiresAt && activation.rentExpiresAt < new Date()) {
      return res.status(403).json({ error: 'Rental period has expired. Please renew your subscription.' });
    }

    // Check if device already registered (upsert)
    const now = new Date();
    let device = await Device.findOne({ collarId: collarId.toUpperCase() });

    if (device) {
      // Transfer ownership — close old history entry
      await Device.updateOne(
        { _id: device._id, 'deviceHistory.toDate': null },
        { $set: { 'deviceHistory.$.toDate': now } }
      );
      // Update to new owner
      device = await Device.findByIdAndUpdate(device._id, {
        userId:       req.user._id,
        deviceStatus: 'active',
        activatedAt:  now,
        activatedBy:  req.user._id,
        $push: {
          deviceHistory: { userId: req.user._id, fromDate: now, reason: 'activation' }
        },
      }, { new: true });
    } else {
      // Fresh device creation
      device = await Device.create({
        collarId:     collarId.toUpperCase(),
        userId:       req.user._id,
        deviceStatus: 'active',
        activatedAt:  now,
        activatedBy:  req.user._id,
        battery: 100, signal: 90, status: 'online',
        temp: 38.5, activity: 60, lastSync: Date.now(),
        deviceHistory: [{ userId: req.user._id, fromDate: now, reason: 'activation' }],
      });
    }

    // Mark activation code as used
    await DeviceActivation.findByIdAndUpdate(activation._id, {
      isUsed: true, usedBy: req.user._id, usedAt: now,
    });

    res.status(201).json({
      message: `Collar ${collarId.toUpperCase()} activated successfully!`,
      device,
    });
  } catch (err) { next(err); }
};

// POST /api/devices/transfer — farmer transfers collar to new owner (e.g. sold cow)
exports.transfer = async (req, res, next) => {
  try {
    const { deviceId, newOwnerPhone } = req.body;
    if (!deviceId || !newOwnerPhone) {
      return res.status(400).json({ error: 'deviceId and newOwnerPhone required.' });
    }

    const device = await Device.findOne({ _id: deviceId, userId: req.user._id });
    if (!device) return res.status(404).json({ error: 'Device not found or not owned by you.' });

    const newOwner = await User.findOne({ phone: newOwnerPhone });
    if (!newOwner) return res.status(404).json({ error: 'No user found with that phone number.' });

    const now = new Date();

    // Close current owner's history entry
    await Device.updateOne(
      { _id: device._id, 'deviceHistory.toDate': null },
      { $set: { 'deviceHistory.$.toDate': now } }
    );

    // Transfer to new owner
    const updated = await Device.findByIdAndUpdate(device._id, {
      userId:       newOwner._id,
      deviceStatus: 'active',
      linkedCowId:  null,    // unlink from old cow
      $push: {
        deviceHistory: { userId: newOwner._id, fromDate: now, reason: 'transfer' }
      },
    }, { new: true });

    res.json({ message: `Collar transferred to ${newOwner.name}.`, device: updated });
  } catch (err) { next(err); }
};

// PUT /api/devices/:id/reset — mark device as lost/damaged, close ownership
exports.reset = async (req, res, next) => {
  try {
    const { reason = 'lost' } = req.body; // 'lost' | 'damaged'
    const device = await Device.findOne({ _id: req.params.id, userId: req.user._id });
    if (!device) return res.status(404).json({ error: 'Device not found.' });

    const now = new Date();
    await Device.updateOne(
      { _id: device._id, 'deviceHistory.toDate': null },
      { $set: { 'deviceHistory.$.toDate': now } }
    );

    const updated = await Device.findByIdAndUpdate(device._id, {
      deviceStatus: reason === 'damaged' ? 'damaged' : 'lost',
      status:       'offline',
    }, { new: true });

    res.json({ message: `Device marked as ${reason}.`, device: updated });
  } catch (err) { next(err); }
};
