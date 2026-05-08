import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { advisoryAPI } from '../services/api';
import { todayStr } from '../data';

// ── Helpers ───────────────────────────────────────────────────────────────────
const PRICE_PER_L = 36;

function pct(val, ref) {
  if (!ref || ref === 0) return 0;
  return Math.round(((val - ref) / ref) * 100);
}

// ── Onboarding Wizard ─────────────────────────────────────────────────────────
function OnboardingWizard({ db, navigate }) {
  const steps = [
    { n: 1, emoji: '🐄', title: 'Add your first cow', sub: 'Start tracking cattle health', action: 'Add Cow', page: 'cattle' },
    { n: 2, emoji: '🥛', title: 'Record today\'s milk', sub: 'Build your milk history', action: 'Log Milk', page: 'milk' },
    { n: 3, emoji: '📡', title: 'Connect Smart Collar', sub: 'Get automatic health alerts', action: 'Learn More', page: 'devices', optional: true },
  ];
  const done = [db.cattle.length > 0, db.milkLog.length > 0, db.devices.length > 0];

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
            Welcome to IndiBreed Tech 👋
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>3 quick steps to get your farm running</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {steps.map((s, i) => (
            <div key={s.n} onClick={() => !done[i] && navigate(s.page)}
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: done[i] ? '#f0fdf4' : 'white', border: `1.5px solid ${done[i] ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '16px', cursor: done[i] ? 'default' : 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: done[i] ? '#16a34a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                {done[i] ? '✅' : s.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: done[i] ? '#15803d' : '#0f172a' }}>
                  {s.title} {s.optional && <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>(optional)</span>}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{done[i] ? 'Done!' : s.sub}</p>
              </div>
              {!done[i] && (
                <div style={{ padding: '8px 14px', background: '#16a34a', color: 'white', borderRadius: '10px', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                  {s.action} →
                </div>
              )}
            </div>
          ))}
        </div>

        {done.slice(0, 2).every(Boolean) && (
          <div style={{ marginTop: '1rem', padding: '14px 16px', background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fde68a', borderRadius: '14px', fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
            🎉 Great start! Your dashboard will appear once you have more data.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Action Alert Card ─────────────────────────────────────────────────────────
function ActionAlertCard({ alert, onResolve, onCallVet }) {
  const isCritical = alert.priority === 'critical';
  return (
    <div style={{ padding: '16px 18px', background: isCritical ? 'linear-gradient(135deg,#fef2f2,#fff5f5)' : 'linear-gradient(135deg,#fffbeb,#fefce8)', border: `2px solid ${isCritical ? '#fca5a5' : '#fde68a'}`, borderRadius: '16px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>{isCritical ? '🔥' : '⚠️'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', color: isCritical ? '#dc2626' : '#d97706', textTransform: 'uppercase' }}>
              {isCritical ? 'Critical — Act Now' : 'Action Required'}
            </span>
          </div>
          <p style={{ margin: '0 0 3px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{alert.title}</p>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>{alert.desc}</p>
          {alert.impactRs > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isCritical ? '#fef2f2' : '#fef3c7', border: `1px solid ${isCritical ? '#fca5a5' : '#fde68a'}`, borderRadius: '8px', padding: '3px 10px', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: isCritical ? '#b91c1c' : '#b45309' }}>
                💸 Estimated loss: ₹{alert.impactRs}/day if untreated
              </span>
            </div>
          )}
          <p style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 600, color: '#374151' }}>→ {alert.action}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={onCallVet} style={{ padding: '7px 14px', background: isCritical ? '#dc2626' : '#d97706', color: 'white', border: 'none', borderRadius: '9px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
              📞 Call Vet
            </button>
            <button onClick={() => onResolve(alert.id)} style={{ padding: '7px 14px', background: 'white', border: '1.5px solid #e2e8f0', color: '#374151', borderRadius: '9px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              ✓ Mark Treated
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Smart Advice Card ─────────────────────────────────────────────────────────
function SmartAdviceCard({ cattle }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cattle?.length || !localStorage.getItem('niralFarm_token')) return;
    const cowId = cattle[0]?.id;
    if (!cowId) return;
    setLoading(true);
    advisoryAPI.get(cowId)
      .then(r => setAdvice(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cattle]);

  if (loading) return (
    <div style={{ padding: '16px 18px', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac', borderRadius: '16px', marginBottom: '10px' }}>
      <p style={{ margin: 0, fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>💡 Loading smart advice...</p>
    </div>
  );

  if (!advice) return null;

  return (
    <div style={{ padding: '16px 18px', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1.5px solid #86efac', borderRadius: '16px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{ fontSize: '1rem' }}>💡</span>
        <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: '#15803d', textTransform: 'uppercase' }}>Smart Advice</span>
        {advice.confidence && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '8px' }}>
            {advice.confidence}% confidence
          </span>
        )}
      </div>
      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#14532d' }}>{advice.title}</p>
      <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#374151', lineHeight: 1.5 }}>{advice.action}</p>
      {advice.impact && (
        <span style={{ display: 'inline-block', fontSize: '12px', fontWeight: 700, color: '#16a34a', background: '#bbf7d0', padding: '3px 10px', borderRadius: '8px' }}>
          {advice.impact}
        </span>
      )}
    </div>
  );
}

// ── Collar Upsell Card ────────────────────────────────────────────────────────
function CollarUpsell({ navigate }) {
  return (
    <div style={{ padding: '16px 18px', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', border: '1.5px solid #93c5fd', borderRadius: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <span style={{ fontSize: '2rem' }}>📡</span>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#1e40af' }}>Get automatic health alerts</p>
        <p style={{ margin: 0, fontSize: '12px', color: '#3b82f6' }}>Smart Collar detects fever instantly — no manual checks needed</p>
      </div>
      <button onClick={() => navigate('devices')} style={{ padding: '8px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
        Learn →
      </button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { db, update, navigate, actionAlerts, todayMilk } = useApp();

  const farmer      = db.farmer;
  const onboardStep = farmer?.onboardingStep ?? 0;
  const hasCattle   = db.cattle?.length > 0;
  const hasMilk     = db.milkLog?.length > 0;

  // Show onboarding wizard until user has cattle + milk data
  const showWizard = onboardStep < 3 && !(hasCattle && hasMilk);

  // Yesterday's milk for comparison
  const yesterday   = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const yesterdayMilk = db.milkLog.filter(m => m.date === yesterday).reduce((s, m) => s + m.total, 0);
  const milkChange  = pct(todayMilk, yesterdayMilk);
  const milkValue   = Math.round(todayMilk * PRICE_PER_L);

  // Days of usage (to decide collar upsell timing)
  const joinDate    = farmer?.joinDate ? new Date(farmer.joinDate) : new Date();
  const daysUsed    = Math.floor((Date.now() - joinDate) / 86400000);
  const showCollarUpsell = daysUsed >= 5 && db.devices.length === 0 && hasCattle;

  const resolveAlert = (id) => {
    update(d => {
      const a = d.alerts.find(a => a.id === id);
      if (a) { a.resolved = true; a.resolvedAt = Date.now(); }
      return d;
    });
  };

  if (showWizard) {
    return <OnboardingWizard db={db} navigate={navigate} />;
  }

  return (
    <div style={{ padding: '1.25rem 1.5rem', maxWidth: '600px', margin: '0 auto', fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ margin: '0 0 2px', fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {farmer?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Action alerts — top priority, always first */}
      {actionAlerts.length > 0 && (
        <div style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              🚨 Action Required ({actionAlerts.length})
            </span>
          </div>
          {actionAlerts.map(a => (
            <ActionAlertCard key={a.id} alert={a} onResolve={resolveAlert} onCallVet={() => {}} />
          ))}
        </div>
      )}

      {/* Today's milk */}
      {hasMilk && (
        <div style={{ padding: '16px 18px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '16px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today's Milk</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{todayMilk.toFixed(1)}</span>
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>litres</span>
                {yesterdayMilk > 0 && (
                  <span style={{ fontSize: '12px', fontWeight: 700, color: milkChange >= 0 ? '#16a34a' : '#dc2626', background: milkChange >= 0 ? '#f0fdf4' : '#fef2f2', padding: '2px 8px', borderRadius: '8px' }}>
                    {milkChange >= 0 ? '↑' : '↓'} {Math.abs(milkChange)}%
                  </span>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Value</p>
              <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>₹{milkValue.toLocaleString('en-IN')}</p>
            </div>
          </div>
          {milkChange < -15 && (
            <div style={{ marginTop: '10px', padding: '8px 12px', background: '#fef2f2', borderRadius: '10px', fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>
              ⚠️ Milk dropped {Math.abs(milkChange)}% vs yesterday — check feed and water supply
            </div>
          )}
        </div>
      )}

      {/* Smart advice */}
      {hasCattle && <SmartAdviceCard cattle={db.cattle} />}

      {/* No alerts & no advice — all clear */}
      {actionAlerts.length === 0 && hasCattle && hasMilk && (
        <div style={{ padding: '16px 18px', background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#15803d' }}>All Clear</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#16a34a' }}>No health alerts. Keep up the good routine.</p>
          </div>
        </div>
      )}

      {/* Collar upsell — only after 5 days */}
      {showCollarUpsell && <CollarUpsell navigate={navigate} />}

      {/* Quick actions */}
      <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {[
          { emoji: '🥛', label: 'Log Milk', page: 'milk' },
          { emoji: '🐄', label: 'My Cattle', page: 'cattle' },
          { emoji: '🔔', label: 'All Alerts', page: 'alerts' },
          { emoji: '💊', label: 'Health Records', page: 'health' },
        ].map(q => (
          <button key={q.page} onClick={() => navigate(q.page)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 15px', background: 'white', border: '1.5px solid #e2e8f0', borderRadius: '14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151', transition: 'all 0.15s' }}>
            <span style={{ fontSize: '1.1rem' }}>{q.emoji}</span> {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}
