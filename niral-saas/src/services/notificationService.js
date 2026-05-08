/**
 * notificationService.js
 * Combines:
 *   1. Browser Notifications API (push, requires permission)
 *   2. In-app toast via react-hot-toast (always works)
 *   3. AudioContext beep for critical alerts (optional)
 */

import { toast } from 'react-hot-toast';

// ── Permission ────────────────────────────────────────────────────────────────
export function requestPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

// ── Browser push notification ─────────────────────────────────────────────────
function sendPush(title, body, icon = '🐄') {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`${icon} ${title}`, { body, icon: '/favicon.ico' });
    } catch { /* silent fail */ }
  }
}

// ── Optional beep via AudioContext ────────────────────────────────────────────
function beep(freq = 880, duration = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch { /* AudioContext may be blocked */ }
}

// ── Typed notification helpers ────────────────────────────────────────────────

/** Critical alert (red toast + push + beep) */
export function notifyCritical(title, body) {
  toast.error(`🚨 ${title}\n${body}`, {
    duration: 8000,
    id: `crit-${title}`,
    style: { background: '#dc2626', color: '#fff', fontWeight: 600 },
  });
  sendPush(title, body, '🚨');
  beep(880, 0.5);
}

/** Warning (yellow toast + push) */
export function notifyWarning(title, body) {
  toast(`⚠️ ${title}`, {
    duration: 6000,
    id: `warn-${title}`,
    icon: '⚠️',
    style: { background: '#d97706', color: '#fff' },
  });
  sendPush(title, body, '⚠️');
}

/** Device offline (orange toast) */
export function notifyDeviceOffline(collarId) {
  toast(`📡 Collar ${collarId} went offline`, {
    duration: 5000,
    id: `offline-${collarId}`,
    icon: '📡',
    style: { background: '#ea580c', color: '#fff' },
  });
}

/** Vaccination reminder (blue toast + push) */
export function notifyVaccination(cowName, vaccine, daysLeft) {
  const body = `${vaccine} due in ${daysLeft} day${daysLeft === 1 ? '' : 's'} for ${cowName}`;
  toast(body, {
    duration: 7000,
    id: `vac-${cowName}-${vaccine}`,
    icon: '💉',
    style: { background: '#2563eb', color: '#fff' },
  });
  sendPush('Vaccination Due', body, '💉');
}

/** Sync error (orange toast) */
export function notifySyncError(message) {
  toast.error(`🔄 Sync error: ${message}`, {
    duration: 5000,
    id: 'sync-error',
    style: { background: '#ea580c', color: '#fff' },
  });
}

/** Success (green toast) */
export function notifySuccess(message) {
  toast.success(message, { duration: 3000 });
}

/** Info (neutral toast) */
export function notifyInfo(message) {
  toast(message, { duration: 3500, icon: 'ℹ️' });
}
