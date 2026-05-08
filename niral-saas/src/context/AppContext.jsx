import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DB, todayStr } from '../data';
import { registerSyncListener } from '../services/syncQueue';
import { requestPermission, notifyCritical, notifyVaccination } from '../services/notificationService';
import api from '../services/api';

const AppCtx = createContext(null);

// ── Priority order for sorting ────────────────────────────────────────────────
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

// Auto-generate smart alerts from live device/cattle data
function computeSmartAlerts(db) {
  const newAlerts = [];
  const now = Date.now();
  const existingIds = new Set(db.alerts.map(a => a.id));

  db.devices.forEach(dev => {
    const cow = db.cattle.find(c => c.id === dev.linkedCowId);
    if (!cow) return;

    if (dev.temp > 40.0) {
      const id = `AUTO-TEMP-CRIT-${dev.id}`;
      if (!existingIds.has(id)) newAlerts.push({
        id, type: 'critical', priority: 'critical', actionRequired: true,
        cowId: cow.id, cowName: cow.name,
        title: `🔥 Fever: ${cow.name}`,
        desc: `Body temp ${dev.temp}°C — severe fever. Normal: 38–39.5°C.`,
        action: 'Administer antipyretics immediately. Call vet.',
        impactRs: Math.round((cow.milkAvg || 5) * 36 * 0.4),
        time: now - 600000, resolved: false,
      });
    } else if (dev.temp > 39.5) {
      const id = `AUTO-TEMP-HIGH-${dev.id}`;
      if (!existingIds.has(id)) newAlerts.push({
        id, type: 'critical', priority: 'high', actionRequired: true,
        cowId: cow.id, cowName: cow.name,
        title: `⚠️ High Temp: ${cow.name}`,
        desc: `Body temp ${dev.temp}°C — elevated.`,
        action: 'Monitor closely. Call vet if rising.',
        impactRs: Math.round((cow.milkAvg || 5) * 36 * 0.2),
        time: now - 600000, resolved: false,
      });
    }
    if (dev.activity < 15 && dev.status === 'online') {
      const id = `AUTO-ACT-CRIT-${dev.id}`;
      if (!existingIds.has(id)) newAlerts.push({
        id, type: 'critical', priority: 'critical', actionRequired: true,
        cowId: cow.id, cowName: cow.name,
        title: `🚨 Critical Low Activity: ${cow.name}`,
        desc: `Activity at only ${dev.activity}% — may indicate collapse or acute illness.`,
        action: 'Inspect immediately. Separate from herd. Call vet.',
        impactRs: Math.round((cow.milkAvg || 5) * 36 * 0.5),
        time: now - 1200000, resolved: false,
      });
    } else if (dev.activity < 25 && dev.status === 'online') {
      const id = `AUTO-ACT-${dev.id}`;
      if (!existingIds.has(id)) newAlerts.push({
        id, type: 'warning', priority: 'high', actionRequired: true,
        cowId: cow.id, cowName: cow.name,
        title: `Low Activity: ${cow.name}`,
        desc: `Activity at ${dev.activity}%. May indicate lameness or illness.`,
        action: 'Inspect hooves, check feed intake.',
        impactRs: Math.round((cow.milkAvg || 5) * 36 * 0.15),
        time: now - 1200000, resolved: false,
      });
    }
    if (dev.battery < 15) {
      const id = `AUTO-BAT-CRIT-${dev.id}`;
      if (!existingIds.has(id)) newAlerts.push({
        id, type: 'critical', priority: 'high', actionRequired: false,
        cowId: cow.id, cowName: cow.name,
        title: `🔋 Critical Battery: ${dev.collarId}`,
        desc: `Battery at ${dev.battery}% — collar will go offline soon.`,
        action: 'Charge collar immediately.', impactRs: 0,
        time: now - 1800000, resolved: false,
      });
    }
    if (dev.status === 'offline') {
      const id = `AUTO-OFF-${dev.id}`;
      if (!existingIds.has(id)) newAlerts.push({
        id, type: 'warning', priority: 'medium', actionRequired: false,
        cowId: cow.id, cowName: cow.name,
        title: `📡 Collar Offline: ${dev.collarId}`,
        desc: `No data from ${cow.name}'s collar.`,
        action: 'Check collar and range.', impactRs: 0,
        time: now - 3600000, resolved: false,
      });
    }
  });

  const today = new Date();
  db.vaccinations?.forEach(v => {
    const diff = Math.ceil((new Date(v.nextDue) - today) / 86400000);
    if (diff >= 0 && diff <= 7) {
      const id = `AUTO-VAC-${v.id}`;
      if (!existingIds.has(id)) {
        const cow = db.cattle.find(c => c.id === v.cowId);
        if (cow) newAlerts.push({
          id, type: 'info', priority: 'medium', actionRequired: false,
          cowId: cow.id, cowName: cow.name,
          title: `💉 Vaccination Due: ${v.vaccine}`,
          desc: `${v.vaccine} due in ${diff} days for ${cow.name}.`,
          action: 'Schedule with vet.', impactRs: 0,
          time: now - 7200000, resolved: false,
        });
      }
    }
  });

  return newAlerts;
}

// ── Subscription feature gate ─────────────────────────────────────────────────
const PLAN_FEATURES = {
  free:       ['cattle', 'milk', 'alerts', 'advisory_basic'],
  pro:        ['cattle', 'milk', 'alerts', 'advisory_basic', 'advisory_ai', 'iot', 'finance'],
  enterprise: ['cattle', 'milk', 'alerts', 'advisory_basic', 'advisory_ai', 'iot', 'finance', 'priority_support'],
};

export function AppProvider({ children }) {
  const [db, setDb] = useState(() => {
    const loaded = DB.load();
    const smart = computeSmartAlerts(loaded);
    if (smart.length > 0) { loaded.alerts = [...loaded.alerts, ...smart]; DB.save(loaded); }
    return loaded;
  });
  const [section, setSection]             = useState('dashboard');
  const [selectedCowId, setSelectedCowId] = useState(null);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');
  const [notifOpen, setNotifOpen]         = useState(false);
  const [isOnline, setIsOnline]           = useState(navigator.onLine);
  const [syncStatus, setSyncStatus]       = useState({ synced: 0, queued: 0, conflicts: [] });

  // ── Role + subscription (from stored auth) ────────────────────────────────
  const storedAuth  = (() => { try { return JSON.parse(localStorage.getItem('niralFarm_auth') || '{}'); } catch { return {}; } })();
  const role        = storedAuth.role || 'farmer';
  const planName    = storedAuth.subscription?.plan || 'free';
  const subscription = { plan: planName, features: PLAN_FEATURES[planName] || PLAN_FEATURES.free };

  // canAccess('iot') — returns true if current plan includes this feature
  const canAccess = useCallback((feature) => {
    return subscription.features.includes(feature);
  }, [subscription.features]);

  // Online/offline detection
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  // Request browser notification permission
  useEffect(() => { requestPermission(); }, []);

  // Register sync queue listener with conflict tracking
  useEffect(() => {
    const unregister = registerSyncListener((progress) => {
      setSyncStatus(progress);
    });
    return unregister;
  }, []);

  // Initial cattle bulk-sync to backend
  useEffect(() => {
    if (!navigator.onLine) return;
    if (!localStorage.getItem('niralFarm_token')) return;
    if (sessionStorage.getItem('niralFarm_cattle_synced')) return;

    const syncCattle = async () => {
      try {
        const loaded = DB.load();
        if (!loaded.cattle?.length) return;
        const payload = loaded.cattle.map(c => ({
          clientId: c.id, name: c.name, breed: c.breed,
          age: c.age || 3, weight: c.weight || 350,
          lactation: c.lactation ?? 0, health: c.health || 'healthy',
          pregnant: c.pregnant || false, collarId: c.collarId || null,
          tagId: c.tagId || '', milkAvg: c.milkAvg || 0, notes: c.notes || '',
        }));
        await api.post('/cattle/bulk-sync', { cattle: payload });
        sessionStorage.setItem('niralFarm_cattle_synced', '1');
      } catch { /* silent fail — backend offline */ }
    };

    syncCattle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push notifications for critical + vaccination alerts
  useEffect(() => {
    const criticals = db.alerts.filter(a => !a.resolved && a.type === 'critical');
    if (criticals.length > 0) {
      setTimeout(() => { criticals.slice(0, 2).forEach(a => notifyCritical(a.title, a.desc)); }, 3000);
    }
    const today = new Date();
    db.vaccinations?.forEach(v => {
      const diff = Math.ceil((new Date(v.nextDue) - today) / 86400000);
      if (diff >= 0 && diff <= 3) {
        const cow = db.cattle.find(c => c.id === v.cowId);
        if (cow) setTimeout(() => notifyVaccination(cow.name, v.vaccine, diff), 5000);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback((updater) => {
    setDb(prev => {
      const next = updater(JSON.parse(JSON.stringify(prev)));
      DB.save(next);
      return next;
    });
  }, []);

  const navigate = useCallback((sec, cowId = null) => {
    setSection(sec);
    setSelectedCowId(cowId);
    setSidebarOpen(false);
  }, []);

  const todayMilk    = db.milkLog.filter(m => m.date === todayStr()).reduce((s, m) => s + m.total, 0);
  const activeAlerts = db.alerts.filter(a => !a.resolved);

  // Action alerts: sorted by priority — shown prominently on dashboard
  const actionAlerts = activeAlerts
    .filter(a => a.actionRequired)
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2));

  // All alerts sorted by priority
  const sortedAlerts = [...activeAlerts].sort((a, b) =>
    (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  );

  return (
    <AppCtx.Provider value={{
      db, update, section, navigate, selectedCowId,
      sidebarOpen, setSidebarOpen,
      searchQuery, setSearchQuery,
      notifOpen, setNotifOpen,
      todayMilk, activeAlerts, sortedAlerts, actionAlerts,
      isOnline, syncStatus,
      role, subscription, canAccess,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
