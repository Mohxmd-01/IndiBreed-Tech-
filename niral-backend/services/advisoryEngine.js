/**
 * NiralFarm Advisory Engine — 3 Layers
 *
 * Layer 1: Rule Engine   — Instant, always runs. Based on thresholds.
 * Layer 2: Context Engine— Enriches rule with cow-specific data (milk trend, health history).
 * Layer 3: AI Fallback   — OpenRouter call only if key is set & no rule matched.
 */

const axios = require('axios');
const Cattle = require('../models/Cattle');
const Device = require('../models/Device');
const MilkRecord = require('../models/MilkRecord');
const Alert = require('../models/Alert');
const logger = require('../utils/logger');

// ── LAYER 1: Rule Engine ──────────────────────────────────────────────────
function applyRules(cow, device, milkTrend) {
  const rules = [];

  // Fever detection
  if (device && device.temp > 39.5) {
    rules.push({
      priority: 'critical',
      layer: 'rule',
      title: `Fever Alert: ${cow.name}`,
      message: `${cow.name} temperature is ${device.temp}°C (Normal: 38–39.5°C). Fever suspected.`,
      action: 'Administer antipyretics. Call vet immediately.',
      trigger: 'temp',
    });
  }

  // Low activity
  if (device && device.activity < 25 && device.status === 'online') {
    rules.push({
      priority: 'warning',
      layer: 'rule',
      title: `Low Activity: ${cow.name}`,
      message: `${cow.name} activity is only ${device.activity}%. May indicate pain, lameness, or illness.`,
      action: 'Inspect hooves, observe gait, check feed intake.',
      trigger: 'activity',
    });
  }

  // Milk yield drop (>20% in 7 days vs previous 7 days)
  if (milkTrend && milkTrend.dropPercent > 20) {
    rules.push({
      priority: 'warning',
      layer: 'rule',
      title: `Milk Drop: ${cow.name}`,
      message: `${cow.name} milk yield dropped ${milkTrend.dropPercent.toFixed(1)}% this week (from ${milkTrend.prevWeekAvg.toFixed(1)}L to ${milkTrend.thisWeekAvg.toFixed(1)}L/day).`,
      action: 'Check feed quality, water supply, health status, and stress factors.',
      trigger: 'milk_drop',
    });
  }

  // Milk improving (positive feedback)
  if (milkTrend && milkTrend.dropPercent < -15) {
    rules.push({
      priority: 'info',
      layer: 'rule',
      title: `Yield Improving: ${cow.name}`,
      message: `${cow.name} milk yield increased ${Math.abs(milkTrend.dropPercent).toFixed(1)}% this week. Current avg: ${milkTrend.thisWeekAvg.toFixed(1)}L/day.`,
      action: 'Maintain current feed and management routine.',
      trigger: 'milk_increase',
    });
  }

  // Pregnancy alert
  if (cow.pregnant) {
    rules.push({
      priority: 'warning',
      layer: 'rule',
      title: `Pregnant: ${cow.name}`,
      message: `${cow.name} is pregnant. Ensure clean calving pen, mineral supplements, and vet on standby.`,
      action: 'Prepare calving pen. Increase energy feed in last 3 weeks.',
      trigger: 'pregnant',
    });
  }

  // Critical battery
  if (device && device.battery < 20) {
    rules.push({
      priority: 'warning',
      layer: 'rule',
      title: `Low Battery: ${device.collarId}`,
      message: `Collar on ${cow.name} has ${device.battery}% battery. May go offline soon.`,
      action: 'Charge or replace collar battery within 24 hours.',
      trigger: 'battery',
    });
  }

  // Device offline
  if (device && device.status === 'offline') {
    rules.push({
      priority: 'warning',
      layer: 'rule',
      title: `Collar Offline: ${device.collarId}`,
      message: `No data from ${cow.name}'s collar. Last seen: ${new Date(device.lastSync).toLocaleString('en-IN')}.`,
      action: 'Check collar, Bluetooth/WiFi range, and battery.',
      trigger: 'offline',
    });
  }

  // No collar at all
  if (!device && cow.lactation > 0) {
    rules.push({
      priority: 'info',
      layer: 'rule',
      title: `No Collar: ${cow.name}`,
      message: `${cow.name} has no smart collar. Real-time health monitoring unavailable.`,
      action: 'Assign a collar to enable IoT monitoring.',
      trigger: 'no_collar',
    });
  }

  return rules;
}

// ── LAYER 2: Context Enrichment ───────────────────────────────────────────
function enrichWithContext(ruleResult, cow, device, milkTrend, recentAlerts) {
  const breed     = cow.breed || 'Unknown';
  const lactStage = ['Dry Period', '1st Lactation', '2nd Lactation', '3rd Lactation', '4th+ Lactation'][cow.lactation] || 'Dry';
  const trendLabel = milkTrend
    ? (milkTrend.dropPercent > 5 ? '📉 Decreasing' : milkTrend.dropPercent < -5 ? '📈 Increasing' : '➡️ Stable')
    : 'Unknown';

  // ── Confidence score (0–100) ────────────────────────────────────────────
  // Based on: data completeness + IoT vs manual signal
  let confidence = 40; // base — rule matched
  if (milkTrend && milkTrend.thisWeekAvg > 0) confidence += 20; // has milk data
  if (device)                                  confidence += 20; // has IoT collar
  if (milkTrend && milkTrend.dataPoints >= 5) confidence += 10; // 5+ days of records
  if (recentAlerts.length > 0)                confidence += 10; // corroborating history
  confidence = Math.min(confidence, 95); // cap at 95% — never 100%

  // ── ₹ impact calculation ───────────────────────────────────────────────
  const milkAvg  = milkTrend?.thisWeekAvg || cow.milkAvg || 5;
  const pricePerL = 36; // ₹/litre — configurable in future
  let impactRs   = 0;
  if (ruleResult.trigger === 'milk_drop' && milkTrend) {
    impactRs = Math.round((milkTrend.prevWeekAvg - milkTrend.thisWeekAvg) * pricePerL);
  } else if (ruleResult.trigger === 'temp') {
    impactRs = Math.round(milkAvg * pricePerL * 0.35); // 35% drop during fever
  } else if (ruleResult.trigger === 'activity') {
    impactRs = Math.round(milkAvg * pricePerL * 0.15);
  }

  const contextSuffix = [
    `\n\n📋 Context: ${cow.name} is a ${cow.age}-year-old ${breed} (${lactStage}).`,
    milkTrend ? `Milk trend (7d): ${trendLabel} — avg ${milkTrend.thisWeekAvg.toFixed(1)}L/day.` : '',
    device ? `Collar: ${device.collarId} | Temp: ${device.temp}°C | Activity: ${device.activity}% | Battery: ${device.battery}%.` : 'No collar data.',
    recentAlerts.length > 0 ? `Recent issues: ${recentAlerts.slice(0, 2).map(a => a.title).join('; ')}.` : '',
  ].filter(Boolean).join(' ');

  return {
    ...ruleResult,
    layer:      'context',
    message:    ruleResult.message + contextSuffix,
    confidence, // 0–100
    impactRs,   // ₹/day
    impact:     impactRs > 0 ? `Estimated loss: ₹${impactRs}/day` : null,
    context:    { breed, lactStage, milkTrend, device: device ? { temp: device.temp, activity: device.activity, battery: device.battery, status: device.status } : null },
  };
}

// ── LAYER 3: AI Fallback ──────────────────────────────────────────────────
async function callAI(cow, device, milkTrend, recentAlerts) {
  if (!process.env.OPENROUTER_API_KEY) {
    return null;  // no key — skip AI
  }

  const prompt = `You are an expert dairy farm advisor for Indian farmers in Maharashtra.
Given this cow's current data, provide ONE specific, actionable recommendation in simple English.
Keep it under 3 sentences. Be direct, not generic.

Cow: ${cow.name} (${cow.breed}, Age: ${cow.age}yr, Lactation: ${cow.lactation})
Health: ${cow.health}
Pregnant: ${cow.pregnant ? 'Yes' : 'No'}
Milk (7d avg): ${milkTrend ? milkTrend.thisWeekAvg.toFixed(1) + 'L/day' : 'No data'}
Milk trend: ${milkTrend ? (milkTrend.dropPercent > 5 ? 'Declining' : milkTrend.dropPercent < -5 ? 'Improving' : 'Stable') : 'Unknown'}
Body temp: ${device ? device.temp + '°C' : 'No collar'}
Activity: ${device ? device.activity + '%' : 'No collar'}
Recent alerts: ${recentAlerts.slice(0, 3).map(a => a.title).join(', ') || 'None'}

Respond in this format ONLY:
Title: [one line title]
Advice: [1-3 sentence recommendation]
Action: [immediate action]`;

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://niralfarm.ai',
        'X-Title': 'NiralFarm Advisory',
      },
      timeout: 10000,
    });

    const text = response.data.choices[0]?.message?.content || '';
    const titleMatch = text.match(/Title:\s*(.+)/i);
    const adviceMatch = text.match(/Advice:\s*(.+)/is);
    const actionMatch = text.match(/Action:\s*(.+)/i);

    return {
      layer:      'ai',
      priority:   'info',
      title:      titleMatch ? titleMatch[1].trim() : `AI Advisory: ${cow.name}`,
      message:    adviceMatch ? adviceMatch[1].trim().replace(/\n/g, ' ') : text.trim(),
      action:     actionMatch ? actionMatch[1].trim() : '',
      confidence: 65, // AI advisory — moderate confidence by default
      impactRs:   0,
      impact:     null,
      context:    { prompt },
    };
  } catch (err) {
    logger.warn('OpenRouter AI call failed:', err.message);
    return null;
  }
}

// ── MILK TREND CALCULATOR ────────────────────────────────────────────────
async function calculateMilkTrend(userId, clientCowId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const day7  = new Date(Date.now() - 7  * 86400000).toISOString().split('T')[0];
    const day14 = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];

    const [thisWeek] = await MilkRecord.aggregate([
      { $match: { userId, clientCowId, date: { $gte: day7, $lte: today } } },
      { $group: { _id: null, avg: { $avg: '$total' }, count: { $sum: 1 } } },
    ]);
    const [prevWeek] = await MilkRecord.aggregate([
      { $match: { userId, clientCowId, date: { $gte: day14, $lt: day7 } } },
      { $group: { _id: null, avg: { $avg: '$total' }, count: { $sum: 1 } } },
    ]);

    if (!thisWeek || !prevWeek || prevWeek.avg === 0) return null;

    const dropPercent = ((prevWeek.avg - thisWeek.avg) / prevWeek.avg) * 100;
    return {
      thisWeekAvg: thisWeek.avg,
      prevWeekAvg: prevWeek.avg,
      dropPercent,   // positive = drop, negative = increase
    };
  } catch { return null; }
}

// ── MAIN ENGINE ENTRY POINT ──────────────────────────────────────────────
async function runAdvisoryEngine({ cowId, userId }) {
  // Load cow data
  const cow = await Cattle.findOne({
    $or: [{ clientId: cowId }, { _id: cowId.match(/^[a-f\d]{24}$/i) ? cowId : null }],
    userId,
  });

  if (!cow) {
    return { layer: 'rule', priority: 'info', title: 'Cow not found', message: 'No data available for this cow.', action: '' };
  }

  // Load device
  const device = await Device.findOne({ userId, linkedCowId: cowId });

  // Load milk trend
  const milkTrend = await calculateMilkTrend(userId, cowId);

  // Load recent alerts
  const recentAlerts = await Alert.find({ userId, cowId, resolved: false }).sort({ time: -1 }).limit(5);

  // Layer 1: Rules
  const rules = applyRules(cow, device, milkTrend);

  if (rules.length > 0) {
    // Pick highest priority rule
    const priority = ['critical', 'warning', 'info'];
    rules.sort((a, b) => priority.indexOf(a.priority) - priority.indexOf(b.priority));
    const topRule = rules[0];

    // Layer 2: Enrich with context
    const enriched = enrichWithContext(topRule, cow, device, milkTrend, recentAlerts);
    return { ...enriched, cowName: cow.name };
  }

  // Layer 3: AI fallback (no rules triggered = cow is healthy, ask AI for proactive advice)
  const aiResult = await callAI(cow, device, milkTrend, recentAlerts);
  if (aiResult) {
    return { ...aiResult, cowName: cow.name };
  }

  // All-clear fallback
  return {
    layer:      'context',
    priority:   'info',
    title:      `All Clear: ${cow.name}`,
    message:    `${cow.name} (${cow.breed}) shows no health concerns. Milk trend is stable. Keep up the good management.`,
    action:     'Continue regular monitoring and scheduled vaccinations.',
    confidence: 80, // High confidence when everything is normal
    impactRs:   0,
    impact:     null,
    cowName:    cow.name,
    context:    { milkTrend, device: device ? { status: device.status } : null },
  };
}

module.exports = { runAdvisoryEngine, applyRules, calculateMilkTrend };
