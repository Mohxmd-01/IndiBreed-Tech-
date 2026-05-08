/**
 * IoT Simulator — generates realistic device telemetry every N seconds.
 * Simulates: temperature fluctuation, activity cycles, battery drain, signal variation.
 * Pushes data to the same telemetry endpoint as real devices would.
 */

const Device = require('../models/Device');
const { generateAlerts } = require('./alertGenerator');
const logger = require('../utils/logger');

// Base vitals per collar (simulates individual animal behavior)
const COW_PROFILES = {
  'SC-1004': { basetemp: 40.1, baseActivity: 20, sick: true },   // Durga — fever
  'SC-1001': { basetemp: 38.2, baseActivity: 72, sick: false },
  'SC-1002': { basetemp: 38.8, baseActivity: 45, sick: false },   // Ganga — pregnant, lower activity
  'SC-1003': { basetemp: 38.5, baseActivity: 61, sick: false },
  'SC-1005': { basetemp: 38.3, baseActivity: 68, sick: false },
  'SC-1006': { basetemp: 38.1, baseActivity: 0,  sick: false, offline: true },  // Sita — offline
};

function jitter(value, range) {
  return +(value + (Math.random() - 0.5) * range * 2).toFixed(1);
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

async function tick(userId) {
  try {
    const devices = await Device.find({ userId });
    if (!devices.length) return;

    for (const dev of devices) {
      const profile = COW_PROFILES[dev.collarId];
      if (!profile) continue;

      if (profile.offline) {
        // Keep device offline, just update lastSync to indicate no contact
        await Device.findByIdAndUpdate(dev._id, { status: 'offline', signal: 0 });
        continue;
      }

      // Simulate gradual battery drain (−0.05% per tick)
      const newBattery = clamp(dev.battery - 0.05, 0, 100);

      // Simulate temperature: sick cows stay elevated, healthy cows within normal range
      const tempBase = profile.basetemp;
      const tempRange = profile.sick ? 0.15 : 0.3;  // smaller jitter when sick (sustained fever)
      const newTemp = clamp(jitter(tempBase, tempRange), 37.5, 42.0);

      // Simulate activity: follows time-of-day pattern
      const hour = new Date().getHours();
      const activityMultiplier = (hour >= 6 && hour <= 10) || (hour >= 16 && hour <= 19) ? 1.1 : 0.9;
      const newActivity = clamp(jitter(profile.baseActivity * activityMultiplier, 5), 0, 100);

      // Signal: random 70–100 for online devices
      const newSignal = clamp(jitter(85, 10), 40, 100);

      // Update device
      const updated = await Device.findByIdAndUpdate(dev._id, {
        temp: newTemp,
        activity: Math.round(newActivity),
        battery: +newBattery.toFixed(1),
        signal: Math.round(newSignal),
        status: 'online',
        lastSync: Date.now(),
        $push: {
          telemetry: {
            $each: [{ temp: newTemp, activity: Math.round(newActivity), battery: +newBattery.toFixed(1), timestamp: Date.now() }],
            $slice: -24,
          }
        }
      }, { new: true });

      // Check for alert conditions
      if (updated) await generateAlerts(updated, userId);
    }
  } catch (err) {
    logger.error('IoT Simulator tick error:', err.message);
  }
}

let simulatorInterval = null;

async function startIoTSimulator() {
  const interval = parseInt(process.env.IOT_POLL_INTERVAL_MS) || 30000;
  logger.info(`🔌 IoT Simulator started — tick every ${interval / 1000}s`);

  // Initial tick after 5s delay (let server fully start)
  setTimeout(async () => {
    try {
      // Find all users and run simulator for each
      const User = require('../models/User');
      const users = await User.find({ isActive: true });
      for (const user of users) {
        await tick(user._id);
      }
    } catch (e) { logger.error('Initial IoT tick error:', e.message); }
  }, 5000);

  simulatorInterval = setInterval(async () => {
    try {
      const User = require('../models/User');
      const users = await User.find({ isActive: true });
      for (const user of users) {
        await tick(user._id);
      }
    } catch (e) { logger.error('IoT tick error:', e.message); }
  }, interval);
}

function stopIoTSimulator() {
  if (simulatorInterval) clearInterval(simulatorInterval);
  logger.info('IoT Simulator stopped.');
}

module.exports = { startIoTSimulator, stopIoTSimulator, tick };
