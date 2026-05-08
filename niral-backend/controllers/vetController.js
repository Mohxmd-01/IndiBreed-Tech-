/**
 * vetController.js — All veterinarian API logic.
 *
 * Vet's core questions:
 *   → "Which case needs me right now?"
 *   → What happened to this cow? What did I prescribe last time?
 */

const VetAssignment = require('../models/VetAssignment');
const Treatment     = require('../models/Treatment');
const VetVisit      = require('../models/VetVisit');
const Alert         = require('../models/Alert');
const User          = require('../models/User');
const Cattle        = require('../models/Cattle');
const Device        = require('../models/Device');
const logger        = require('../utils/logger');

const todayStr = () => new Date().toISOString().split('T')[0];

// ─────────────────────────────────────────────────────────────────────────────
// LINKING — Vet sends request to farmer by phone number
// POST /api/vet/link/request   body: { phone, message? }
// ─────────────────────────────────────────────────────────────────────────────
exports.requestLink = async (req, res, next) => {
  try {
    const { phone, message = '' } = req.body;
    if (!phone) return res.status(400).json({ error: 'Farmer phone required.' });

    const farmer = await User.findOne({ phone, role: 'farmer' });
    if (!farmer) return res.status(404).json({ error: 'No farmer found with that phone number.' });

    const existing = await VetAssignment.findOne({ vetId: req.user._id, farmerId: farmer._id });
    if (existing) {
      if (existing.status === 'accepted') return res.status(409).json({ error: 'Already linked to this farmer.' });
      if (existing.status === 'pending')  return res.status(409).json({ error: 'Link request already pending.' });
    }

    const link = await VetAssignment.create({
      vetId: req.user._id, farmerId: farmer._id,
      initiatedBy: 'vet', message,
    });

    // Send alert to farmer
    await Alert.create({
      userId: farmer._id,
      type: 'info', priority: 'medium', actionRequired: false,
      title: `🩺 Vet Request: ${req.user.name}`,
      desc: `Dr. ${req.user.name} wants to link with your farm${message ? ': ' + message : '.'}`,
      action: 'Accept or decline in your Profile → Vet Requests.',
      source: 'rule', targetRole: 'farmer',
      cooldownKey: `vet-link-${req.user._id}-${farmer._id}`,
      time: Date.now(),
    });

    res.status(201).json({ link, farmerName: farmer.name });
  } catch (err) { next(err); }
};

// PUT /api/vet/link/:id   body: { accept: true|false }
exports.respondToLink = async (req, res, next) => {
  try {
    const link = await VetAssignment.findById(req.params.id);
    if (!link) return res.status(404).json({ error: 'Link request not found.' });

    // Only the non-initiating side responds
    const isVet    = String(link.vetId) === String(req.user._id);
    const isFarmer = String(link.farmerId) === String(req.user._id);
    if (!isVet && !isFarmer) return res.status(403).json({ error: 'Not your link request.' });
    if (link.initiatedBy === 'vet'    && isVet)    return res.status(400).json({ error: 'You initiated this request.' });
    if (link.initiatedBy === 'farmer' && isFarmer) return res.status(400).json({ error: 'You initiated this request.' });

    const { accept } = req.body;
    link.status      = accept ? 'accepted' : 'rejected';
    link.respondedAt = new Date();
    await link.save();

    res.json({ link, status: link.status });
  } catch (err) { next(err); }
};

// GET /api/vet/links   — All linked farmers (accepted)
exports.getLinks = async (req, res, next) => {
  try {
    const links = await VetAssignment.find({ vetId: req.user._id, status: 'accepted' })
      .populate('farmerId', 'name phone farmName village district');
    res.json({ links });
  } catch (err) { next(err); }
};

// GET /api/vet/links/pending   — Pending requests (incoming to vet)
exports.getPendingLinks = async (req, res, next) => {
  try {
    const pending = await VetAssignment.find({
      vetId: req.user._id, status: 'pending', initiatedBy: 'farmer'
    }).populate('farmerId', 'name phone farmName village');
    res.json({ pending });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// TASK FEED — Core vet view: urgent cases + today's visits
// GET /api/vet/feed
// ─────────────────────────────────────────────────────────────────────────────
exports.getFeed = async (req, res, next) => {
  try {
    // Get all linked farmers
    const links = await VetAssignment.find({ vetId: req.user._id, status: 'accepted' });
    const farmerIds = links.map(l => l.farmerId);

    if (farmerIds.length === 0) {
      return res.json({ urgentCases: [], todayVisits: [], linkedFarmers: 0 });
    }

    // Urgent: unresolved actionRequired alerts from linked farmers
    const urgentAlerts = await Alert.find({
      userId: { $in: farmerIds },
      actionRequired: true,
      resolved: false,
    })
      .sort({ priority: 1, time: -1 })
      .limit(20)
      .populate('userId', 'name phone farmName');

    // Today's visits
    const todayVisits = await VetVisit.find({
      vetId: req.user._id,
      date: todayStr(),
      status: 'scheduled',
    }).populate('farmerId', 'name phone farmName village');

    // Recent treatments for context (last 5)
    const recentTreatments = await Treatment.find({ vetId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('farmerId', 'name farmName');

    res.json({ urgentCases: urgentAlerts, todayVisits, recentTreatments, linkedFarmers: farmerIds.length });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// FARMERS — Vet's linked farmer list with health summary
// GET /api/vet/farmers
// ─────────────────────────────────────────────────────────────────────────────
exports.getFarmers = async (req, res, next) => {
  try {
    const links = await VetAssignment.find({ vetId: req.user._id, status: 'accepted' })
      .populate('farmerId', 'name phone farmName village district');

    const farmers = await Promise.all(links.map(async (link) => {
      const f = link.farmerId;
      const [cattleCount, openAlerts, lastVisit] = await Promise.all([
        Cattle.countDocuments({ userId: f._id }),
        Alert.countDocuments({ userId: f._id, actionRequired: true, resolved: false }),
        VetVisit.findOne({ vetId: req.user._id, farmerId: f._id, status: 'completed' })
          .sort({ date: -1 }),
      ]);

      return {
        _id: f._id, name: f.name, phone: f.phone,
        farmName: f.farmName, village: f.village, district: f.district,
        cattleCount, openAlerts, lastVisit: lastVisit?.date || null,
        riskLevel: openAlerts >= 2 ? 'high' : openAlerts === 1 ? 'medium' : 'low',
      };
    }));

    res.json({ farmers: farmers.sort((a, b) => b.openAlerts - a.openAlerts) });
  } catch (err) { next(err); }
};

// GET /api/vet/farmers/:farmerId   — Single farmer detail for vet
exports.getFarmerDetail = async (req, res, next) => {
  try {
    const link = await VetAssignment.findOne({ vetId: req.user._id, farmerId: req.params.farmerId, status: 'accepted' });
    if (!link) return res.status(403).json({ error: 'Not linked to this farmer.' });

    const [farmer, cattle, devices, alerts, treatments] = await Promise.all([
      User.findById(req.params.farmerId).select('name phone farmName village district'),
      Cattle.find({ userId: req.params.farmerId }),
      Device.find({ userId: req.params.farmerId }),
      Alert.find({ userId: req.params.farmerId, resolved: false }).sort({ priority: 1, time: -1 }).limit(10),
      Treatment.find({ vetId: req.user._id, farmerId: req.params.farmerId }).sort({ date: -1 }).limit(10),
    ]);

    // Enrich cattle with device data
    const cattleWithDevice = cattle.map(c => {
      const dev = devices.find(d => d.linkedCowId === c.clientId);
      return { ...c.toObject(), device: dev ? { temp: dev.temp, activity: dev.activity, battery: dev.battery, status: dev.status } : null };
    });

    res.json({ farmer, cattle: cattleWithDevice, alerts, treatments });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// TREATMENTS
// POST /api/vet/treatments
// GET  /api/vet/treatments   (all by this vet)
// GET  /api/vet/treatments/:farmerId
// ─────────────────────────────────────────────────────────────────────────────
exports.addTreatment = async (req, res, next) => {
  try {
    const { farmerId, cowId, cowName, date, diagnosis, medicines, notes, followUpDate, outcome, alertId } = req.body;
    if (!farmerId || !cowId || !diagnosis) return res.status(400).json({ error: 'farmerId, cowId, diagnosis required.' });

    const link = await VetAssignment.findOne({ vetId: req.user._id, farmerId, status: 'accepted' });
    if (!link) return res.status(403).json({ error: 'Not linked to this farmer.' });

    const treatment = await Treatment.create({
      vetId: req.user._id, farmerId, cowId, cowName: cowName || 'Unknown',
      date: date || todayStr(), diagnosis, medicines: medicines || [],
      notes: notes || '', followUpDate, outcome: outcome || 'ongoing', alertId,
    });

    // If linked to an alert, schedule a follow-up alert
    if (alertId && followUpDate) {
      await Alert.create({
        userId: farmerId,
        type: 'info', priority: 'medium', actionRequired: false,
        title: `📅 Follow-up: ${cowName}`,
        desc: `Dr. ${req.user.name} scheduled a follow-up for ${cowName} on ${followUpDate}.`,
        action: 'Ensure cow is monitored. Vet will re-check on this date.',
        source: 'rule', targetRole: 'farmer', time: Date.now(),
      });
    }

    logger.info(`Treatment added by vet ${req.user._id} for farmer ${farmerId}, cow: ${cowId}`);
    res.status(201).json({ treatment });
  } catch (err) { next(err); }
};

exports.getTreatments = async (req, res, next) => {
  try {
    const filter = { vetId: req.user._id };
    if (req.params.farmerId) filter.farmerId = req.params.farmerId;
    const treatments = await Treatment.find(filter).sort({ date: -1 }).limit(50)
      .populate('farmerId', 'name farmName');
    res.json({ treatments });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────────────────────
// VISITS
// POST /api/vet/visits
// GET  /api/vet/visits
// PUT  /api/vet/visits/:id/complete
// ─────────────────────────────────────────────────────────────────────────────
exports.scheduleVisit = async (req, res, next) => {
  try {
    const { farmerId, date, time, reason } = req.body;
    if (!farmerId || !date || !reason) return res.status(400).json({ error: 'farmerId, date, reason required.' });

    const link = await VetAssignment.findOne({ vetId: req.user._id, farmerId, status: 'accepted' });
    if (!link) return res.status(403).json({ error: 'Not linked to this farmer.' });

    const visit = await VetVisit.create({ vetId: req.user._id, farmerId, date, time: time || '', reason });

    // Notify farmer
    await Alert.create({
      userId: farmerId,
      type: 'info', priority: 'medium', actionRequired: false,
      title: `📅 Vet Visit Scheduled`,
      desc: `Dr. ${req.user.name} will visit on ${date}${time ? ' at ' + time : ''}. Reason: ${reason}`,
      action: 'Ensure cattle are accessible for examination.',
      source: 'rule', targetRole: 'farmer', time: Date.now(),
    });

    res.status(201).json({ visit });
  } catch (err) { next(err); }
};

exports.getVisits = async (req, res, next) => {
  try {
    const visits = await VetVisit.find({ vetId: req.user._id })
      .sort({ date: -1 }).limit(30)
      .populate('farmerId', 'name phone farmName village');
    res.json({ visits });
  } catch (err) { next(err); }
};

exports.completeVisit = async (req, res, next) => {
  try {
    const visit = await VetVisit.findOne({ _id: req.params.id, vetId: req.user._id });
    if (!visit) return res.status(404).json({ error: 'Visit not found.' });
    visit.status = 'completed';
    visit.notes  = req.body.notes || visit.notes;
    visit.completedAt = new Date();
    await visit.save();
    res.json({ visit });
  } catch (err) { next(err); }
};

exports.cancelVisit = async (req, res, next) => {
  try {
    const visit = await VetVisit.findOneAndUpdate(
      { _id: req.params.id, vetId: req.user._id },
      { status: 'cancelled' }, { new: true }
    );
    if (!visit) return res.status(404).json({ error: 'Visit not found.' });
    res.json({ visit });
  } catch (err) { next(err); }
};

// GET /api/vet/profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  const [totalFarmers, totalTreatments, totalVisits] = await Promise.all([
    VetAssignment.countDocuments({ vetId: req.user._id, status: 'accepted' }),
    Treatment.countDocuments({ vetId: req.user._id }),
    VetVisit.countDocuments({ vetId: req.user._id, status: 'completed' }),
  ]);
  res.json({ user, stats: { totalFarmers, totalTreatments, totalVisits } });
};
