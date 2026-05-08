/**
 * alertGenerator.js — Priority-based alert engine with cooldown & ₹ impact.
 *
 * Phase 1 responsibilities:
 *  1. Evaluate priority from hard-coded threshold table
 *  2. Set actionRequired: true only for health-critical events
 *  3. Compute impactRs (estimated ₹/day loss)
 *  4. Cooldown check — skip if cooldownUntil > now for same cooldownKey
 *  5. Auto-resolve alerts when condition clears
 *
 * Phase 2+ (cross-role dispatch) hooked in here but gated behind feature flag.
 */

const Alert  = require('../models/Alert');
const Cattle = require('../models/Cattle');
const logger = require('../utils/logger');

// ── Priority + cooldown thresholds ────────────────────────────────────────────
const RULES = [
  {
    id:             'fever_critical',
    check:          (d) => d.temp > 40.0,
    type:           'critical',
    priority:       'critical',
    actionRequired: true,
    cooldownHours:  4,
    title:          (d, cow) => `🔥 Fever: ${cow}`,
    desc:           (d, cow) => `${cow} temperature is ${d.temp}°C — severe fever. Normal: 38–39.5°C.`,
    action:         'Administer antipyretics immediately. Call vet. Estimated loss: ₹{impactRs}/day.',
    impactFn:       (d, cow, milkAvg) => Math.round((milkAvg || 5) * 36 * 0.4), // 40% milk drop @ ₹36/L
  },
  {
    id:             'fever_high',
    check:          (d) => d.temp > 39.5 && d.temp <= 40.0,
    type:           'critical',
    priority:       'high',
    actionRequired: true,
    cooldownHours:  4,
    title:          (d, cow) => `⚠️ High Temp: ${cow}`,
    desc:           (d, cow) => `${cow} temperature is ${d.temp}°C — elevated. Monitor closely.`,
    action:         'Check for other symptoms. Call vet if temp continues rising.',
    impactFn:       (d, cow, milkAvg) => Math.round((milkAvg || 5) * 36 * 0.2),
  },
  {
    id:             'activity_critical',
    check:          (d) => d.activity < 15 && d.status === 'online',
    type:           'critical',
    priority:       'critical',
    actionRequired: true,
    cooldownHours:  4,
    title:          (d, cow) => `🚨 Critical Low Activity: ${cow}`,
    desc:           (d, cow) => `${cow} activity at ${d.activity}% — severe. May indicate collapse, injury, or acute illness.`,
    action:         'Inspect cow immediately. Separate from herd. Call vet.',
    impactFn:       (d, cow, milkAvg) => Math.round((milkAvg || 5) * 36 * 0.5),
  },
  {
    id:             'activity_high',
    check:          (d) => d.activity >= 15 && d.activity < 25 && d.status === 'online',
    type:           'warning',
    priority:       'high',
    actionRequired: true,
    cooldownHours:  4,
    title:          (d, cow) => `Low Activity: ${cow}`,
    desc:           (d, cow) => `${cow} activity at ${d.activity}%. May indicate pain, lameness, or early illness.`,
    action:         'Inspect hooves, check feed intake, observe gait.',
    impactFn:       (d, cow, milkAvg) => Math.round((milkAvg || 5) * 36 * 0.15),
  },
  {
    id:             'battery_critical',
    check:          (d) => d.battery < 15,
    type:           'critical',
    priority:       'high',
    actionRequired: false,
    cooldownHours:  24,
    title:          (d, cow) => `🔋 Critical Battery: ${d.collarId}`,
    desc:           (d, cow) => `Collar on ${cow} at ${d.battery}% — will go offline soon. Data gaps imminent.`,
    action:         'Charge collar immediately.',
    impactFn:       () => 0,
  },
  {
    id:             'battery_low',
    check:          (d) => d.battery >= 15 && d.battery < 25,
    type:           'warning',
    priority:       'medium',
    actionRequired: false,
    cooldownHours:  24,
    title:          (d, cow) => `Low Battery: ${d.collarId}`,
    desc:           (d, cow) => `Collar on ${cow} at ${d.battery}%. Charge within 24 hours.`,
    action:         'Schedule collar charging.',
    impactFn:       () => 0,
  },
  {
    id:             'collar_offline',
    check:          (d) => d.status === 'offline',
    type:           'warning',
    priority:       'medium',
    actionRequired: false,
    cooldownHours:  6,
    title:          (d, cow) => `📡 Collar Offline: ${d.collarId}`,
    desc:           (d, cow) => `No data from ${cow}'s collar. Last sync: ${new Date(d.lastSync).toLocaleTimeString('en-IN')}.`,
    action:         'Check collar, Bluetooth/WiFi range, and battery.',
    impactFn:       () => 0,
  },
  {
    id:             'hypothermia',
    check:          (d) => d.temp < 37.5,
    type:           'warning',
    priority:       'high',
    actionRequired: true,
    cooldownHours:  4,
    title:          (d, cow) => `❄️ Low Temperature: ${cow}`,
    desc:           (d, cow) => `${cow} temperature is ${d.temp}°C — possible hypothermia or sensor error.`,
    action:         'Provide warmth. Verify sensor. Call vet if temp is confirmed low.',
    impactFn:       (d, cow, milkAvg) => Math.round((milkAvg || 5) * 36 * 0.2),
  },
];

// ── Auto-resolve mapping: when condition clears, resolve this rule's alerts ──
const RESOLVE_WHEN = {
  fever_critical:     (d) => d.temp <= 39.5,
  fever_high:         (d) => d.temp <= 39.5,
  activity_critical:  (d) => d.activity >= 25 || d.status !== 'online',
  activity_high:      (d) => d.activity >= 25 || d.status !== 'online',
  collar_offline:     (d) => d.status === 'online',
  hypothermia:        (d) => d.temp >= 37.5,
};

// ── Main function ─────────────────────────────────────────────────────────────
async function generateAlerts(device, userId) {
  try {
    const cow    = await Cattle.findOne({ userId, clientId: device.linkedCowId });
    const cowName  = cow?.name   || 'Unknown';
    const cowId    = device.linkedCowId || '';
    const milkAvg  = cow?.milkAvg || 5; // litres/day fallback

    const now = new Date();

    for (const rule of RULES) {
      const cooldownKey = `${rule.id}-${device.collarId}-farmer`;

      // ── Check if condition is met ─────────────────────────────────────────
      if (!rule.check(device)) {
        // Auto-resolve if condition cleared
        if (RESOLVE_WHEN[rule.id]?.(device)) {
          await Alert.updateMany(
            { userId, cooldownKey, resolved: false },
            { resolved: true, resolvedAt: now }
          );
        }
        continue;
      }

      // ── Cooldown check — skip if still in cooldown window ─────────────────
      const activeInCooldown = await Alert.findOne({
        userId,
        cooldownKey,
        resolved: false,
        cooldownUntil: { $gt: now },
      });
      if (activeInCooldown) continue;

      // ── Also skip if unresolved alert already exists (no cooldownUntil set) ─
      const existing = await Alert.findOne({ userId, cooldownKey, resolved: false });
      if (existing) continue;

      // ── Compute ₹ impact ──────────────────────────────────────────────────
      const impactRs = rule.impactFn(device, cowName, milkAvg);

      // ── Build action string with actual ₹ value ───────────────────────────
      const actionText = rule.action.replace('{impactRs}', impactRs);

      // ── Create alert ──────────────────────────────────────────────────────
      await Alert.create({
        userId,
        cowId,
        cowName,
        clientId:       `${cooldownKey}-${Date.now()}`,
        type:           rule.type,
        priority:       rule.priority,
        actionRequired: rule.actionRequired,
        title:          rule.title(device, cowName),
        desc:           rule.desc(device, cowName),
        action:         actionText,
        impactRs,
        targetRole:     'farmer',
        cooldownKey,
        cooldownUntil:  new Date(now.getTime() + rule.cooldownHours * 3600000),
        source:         'iot',
        time:           Date.now(),
      });

      logger.debug(`Alert [${rule.priority}] created: ${rule.id} for ${cowName}`);
    }
  } catch (err) {
    logger.error('Alert generation error:', err.message);
  }
}

module.exports = { generateAlerts };
