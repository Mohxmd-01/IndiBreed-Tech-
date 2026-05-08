import { useState } from 'react';
import { CheckCircle, AlertTriangle, Info, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { alertsAPI } from '../services/api';

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const PRIORITY_CONFIG = {
  critical: { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', badgeBg: '#fee2e2', label: 'CRITICAL', icon: '🔥' },
  high:     { bg: '#fffbeb', border: '#fde68a', badge: '#d97706', badgeBg: '#fef3c7', label: 'HIGH',     icon: '⚠️' },
  medium:   { bg: '#f0f9ff', border: '#bae6fd', badge: '#0284c7', badgeBg: '#e0f2fe', label: 'MEDIUM',   icon: '📋' },
  low:      { bg: '#f8fafc', border: '#e2e8f0', badge: '#64748b', badgeBg: '#f1f5f9', label: 'LOW',      icon: 'ℹ️' },
};

function AlertCard({ alert, onResolve }) {
  const priority = alert.priority || (alert.type === 'critical' ? 'critical' : alert.type === 'warning' ? 'high' : 'low');
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.low;

  return (
    <div style={{ padding: '14px 16px', background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: '14px', marginBottom: '8px', opacity: alert.resolved ? 0.55 : 1, transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>{cfg.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.07em', color: cfg.badge, background: cfg.badgeBg, padding: '2px 7px', borderRadius: '6px' }}>
              {cfg.label}
            </span>
            {alert.actionRequired && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', padding: '2px 7px', borderRadius: '6px' }}>
                ACTION REQUIRED
              </span>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8' }}>
              {alert.resolved ? '✓ Resolved' : new Date(alert.time || alert.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{alert.title}</p>
          {alert.cowName && <p style={{ margin: '0 0 3px', fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>🐄 {alert.cowName}</p>}
          <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>{alert.desc}</p>

          {alert.impactRs > 0 && !alert.resolved && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '3px 10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#b91c1c' }}>
                💸 Est. loss: ₹{alert.impactRs}/day if untreated
              </span>
            </div>
          )}

          {alert.action && <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>→ {alert.action.replace(/ Estimated.*/, '')}</p>}

          {!alert.resolved && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => onResolve(alert.id || alert._id)} style={{ padding: '6px 12px', background: 'white', border: '1.5px solid #e2e8f0', color: '#374151', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={12} /> Resolve
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { sortedAlerts, actionAlerts, update } = useApp();
  const [filter, setFilter]   = useState('all'); // all | action | critical | resolved
  const [resolving, setResolving] = useState(null);

  const resolve = async (id) => {
    setResolving(id);
    try {
      // Try backend first
      if (localStorage.getItem('niralFarm_token') && id.length === 24) {
        await alertsAPI.resolve(id);
      }
    } catch { /* offline — resolve locally */ }

    update(d => {
      const a = d.alerts.find(a => a.id === id || a._id === id);
      if (a) { a.resolved = true; a.resolvedAt = Date.now(); }
      return d;
    });
    setResolving(null);
  };

  const allAlerts = sortedAlerts || [];

  const filtered = allAlerts.filter(a => {
    if (filter === 'action')   return a.actionRequired && !a.resolved;
    if (filter === 'critical') return (a.priority === 'critical' || a.priority === 'high') && !a.resolved;
    if (filter === 'resolved') return a.resolved;
    return true; // 'all'
  });

  const unresolvedCount   = allAlerts.filter(a => !a.resolved).length;
  const actionCount       = actionAlerts?.length || 0;

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '620px', margin: '0 auto', fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>Alerts</h1>
          {unresolvedCount > 0 && (
            <span style={{ background: '#dc2626', color: 'white', fontSize: '12px', fontWeight: 800, padding: '2px 9px', borderRadius: '99px' }}>{unresolvedCount}</span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Sorted by priority — most urgent first</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all',      label: `All (${allAlerts.length})` },
          { key: 'action',   label: `🚨 Action (${actionCount})` },
          { key: 'critical', label: '🔥 Critical' },
          { key: 'resolved', label: '✓ Resolved' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: '6px 13px', borderRadius: '10px', border: filter === f.key ? '2px solid #16a34a' : '1.5px solid #e2e8f0', background: filter === f.key ? '#f0fdf4' : 'white', color: filter === f.key ? '#15803d' : '#64748b', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{filter === 'resolved' ? '✅' : '🎉'}</div>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#374151' }}>
            {filter === 'resolved' ? 'No resolved alerts yet' : 'No alerts here!'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
            {filter === 'resolved' ? 'Alerts you resolve will appear here' : 'Your farm is looking healthy 🌾'}
          </p>
        </div>
      ) : (
        filtered.map(a => (
          <AlertCard key={a.id || a._id} alert={a} onResolve={resolve} resolving={resolving} />
        ))
      )}
    </div>
  );
}
