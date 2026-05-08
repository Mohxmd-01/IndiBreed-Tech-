import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { AlertCircle, AlertTriangle, Info, Thermometer, Baby, Flame, Battery,
         Syringe, Cloud, CheckCircle, Beef, Droplets, Leaf, Sun,
         Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { advisoryAPI } from '../services/api';

const BREEDS = [
  { name: 'Gir',          emoji: '🐄', milk: '8–12L/day',  traits: 'Heat tolerant, A2 milk, ideal for Maharashtra',     color: 'bg-green-50 border-green-200',  badge: 'bg-green-100 text-green-700' },
  { name: 'HF Cross',     emoji: '🐮', milk: '15–25L/day', traits: 'High yield, needs cool climate & good feed',         color: 'bg-blue-50 border-blue-200',    badge: 'bg-blue-100 text-blue-700' },
  { name: 'Sahiwal',      emoji: '🐄', milk: '10–15L/day', traits: 'Disease resistant, tick tolerant, sturdy',           color: 'bg-amber-50 border-amber-200',  badge: 'bg-amber-100 text-amber-700' },
  { name: 'Murrah Buffalo',emoji: '🦬',milk: '12–20L/day', traits: 'High fat milk (7–8%), ideal for ghee/paneer',        color: 'bg-purple-50 border-purple-200',badge: 'bg-purple-100 text-purple-700' },
];

const FEED_TIPS = [
  { icon: Leaf,     tip: '60% roughage + 40% concentrate for optimal production', color: 'text-green-600', bg: 'bg-green-50' },
  { icon: Droplets, tip: 'Fresh water always available — 50–80L/day per animal',  color: 'text-blue-600',  bg: 'bg-blue-50' },
  { icon: Beef,     tip: 'Add 50g mineral mix per day per cow for immunity',       color: 'text-orange-600',bg: 'bg-orange-50' },
  { icon: Sun,      tip: 'Avoid sudden feed changes — transition over 7–10 days', color: 'text-yellow-600',bg: 'bg-yellow-50' },
];

// Per-cow AI advisory panel
function CowAdvisoryPanel({ cow }) {
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [open,     setOpen]     = useState(false);
  const [error,    setError]    = useState(null);

  const fetchAdvisory = useCallback(async () => {
    if (result) { setOpen(o => !o); return; }
    setLoading(true); setError(null);
    try {
      const r = await advisoryAPI.get(cow.id);
      setResult(r.data);
      setOpen(true);
    } catch (e) {
      setError(e.response?.data?.error || 'Backend offline — advisory unavailable');
      setOpen(true);
    } finally { setLoading(false); }
  }, [cow.id, result]);

  const priorityColors = {
    critical: 'bg-red-50 border-red-200 text-red-700',
    warning:  'bg-yellow-50 border-yellow-200 text-yellow-700',
    info:     'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className="mt-3">
      <button
        onClick={fetchAdvisory}
        disabled={loading}
        className="flex items-center gap-2 text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        {loading ? 'Asking AI…' : result ? (open ? 'Hide Advisory' : 'Show Advisory') : 'Ask AI Advisory'}
        {result && !loading && (open ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </button>

      {open && (
        <div className={`mt-2 p-3 rounded-xl border text-xs ${error ? 'bg-gray-50 border-gray-200 text-gray-500' : priorityColors[result?.priority] || priorityColors.info}`}>
          {error ? (
            <p>{error}</p>
          ) : result ? (
            <>
              <p className="font-bold mb-1">{result.title}</p>
              <p className="leading-relaxed">{result.message}</p>
              {result.action && <p className="mt-2 font-semibold">→ {result.action}</p>}
              <p className="mt-2 text-[10px] opacity-60">Layer: {result.layer} · {new Date().toLocaleTimeString('en-IN')}</p>
              {result.context?.milkTrend && (
                <p className="mt-1 text-[10px] opacity-60">
                  Milk trend: {result.context.milkTrend.thisWeekAvg?.toFixed(1)}L avg /
                  prev {result.context.milkTrend.prevWeekAvg?.toFixed(1)}L
                </p>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function Advisory() {
  const { db, navigate, isOnline } = useApp();
  const { t } = useTranslation();
  const today = new Date();
  const cards = [];

  // Critical alerts
  db.cattle.filter(c => c.health === 'critical').forEach(c => {
    cards.push({ priority: 'critical', icon: AlertCircle,
      title: `${t('filterCritical')}: ${c.name} needs vet attention`,
      body: `${c.name} (${c.breed}) is in critical health. Isolate from herd, check vitals, contact your vet immediately.`,
      action: t('viewHealth'), cowId: c.id });
  });

  db.devices.filter(d => d.temp > 39.5).forEach(dv => {
    const cow = db.cattle.find(c => c.id === dv.linkedCowId);
    if (cow) cards.push({ priority: 'critical', icon: Thermometer,
      title: `Fever Alert: ${cow.name}`,
      body: `Collar ${dv.collarId} reports ${dv.temp}°C. Normal: 38–39.5°C. Administer antipyretics and monitor closely.`,
      action: t('viewHealth'), cowId: cow.id });
  });

  db.cattle.filter(c => c.pregnant).forEach(c => {
    cards.push({ priority: 'warning', icon: Baby,
      title: `Calving Preparation: ${c.name}`,
      body: 'Prepare clean calving pen, dry bedding, colostrum supplies. Keep vet contact ready.',
      action: t('viewRepro'), cowId: c.id });
  });

  (db.reproductions || []).filter(r => r.type === 'heat' && !r.success).forEach(r => {
    const cow = db.cattle.find(c => c.id === r.cowId);
    if (cow) cards.push({ priority: 'warning', icon: Flame,
      title: `AI Window Open: ${cow.name}`,
      body: 'Standing heat detected. Optimal insemination window is within the next 12–18 hours.',
      action: t('viewRepro'), cowId: cow.id });
  });

  db.devices.filter(d => d.battery < 25).forEach(dv => {
    const cow = db.cattle.find(c => c.id === dv.linkedCowId);
    cards.push({ priority: 'warning', icon: Battery,
      title: `Low Battery: ${dv.collarId}`,
      body: `Collar on ${cow?.name || 'unknown'} has ${dv.battery}% battery. Charge within 24 hours.`,
      action: t('manageCollars2') });
  });

  db.vaccinations.filter(v => {
    const d = Math.ceil((new Date(v.nextDue) - today) / 86400000);
    return d >= 0 && d <= 14;
  }).forEach(v => {
    const cow = db.cattle.find(c => c.id === v.cowId);
    const diff = Math.ceil((new Date(v.nextDue) - today) / 86400000);
    cards.push({ priority: 'info', icon: Syringe,
      title: `Vaccine Due: ${cow?.name} — ${v.vaccine}`,
      body: `${v.vaccine} due in ${diff} days (${v.nextDue}).`,
      action: t('viewHealth') });
  });

  const month = today.getMonth();
  const seasonal = {
    3: 'Summer approaching: Ensure shade and water. Add electrolytes.',
    4: 'Peak summer: Monitor heat stress. Provide cool water multiple times daily.',
    5: 'Pre-monsoon: Vaccinate against FMD and HS before rains.',
    6: 'Monsoon: Prevent hoof rot. Deworm entire herd. Keep sheds dry.',
    9: 'Post-monsoon: Check for ticks. Supplement Vitamin A & D.',
    11: 'Winter: Increase energy feed. Provide warm shelter at night.',
  };
  if (seasonal[month]) cards.push({ priority: 'info', icon: Cloud, title: t('seasonalTips'), body: seasonal[month] });

  const cfg = {
    critical: { border: 'border-l-red-500',    iconBg: 'bg-red-50',    iconColor: 'text-red-600',    badge: 'badge-red' },
    warning:  { border: 'border-l-yellow-400',  iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600', badge: 'badge-yellow' },
    info:     { border: 'border-l-blue-400',    iconBg: 'bg-blue-50',   iconColor: 'text-blue-600',   badge: 'badge-blue' },
  };

  const criticals = cards.filter(c => c.priority === 'critical');
  const warnings  = cards.filter(c => c.priority === 'warning');
  const infos     = cards.filter(c => c.priority === 'info');

  const renderCard = (card, i) => {
    const s = cfg[card.priority];
    const Icon = card.icon;
    return (
      <div key={i} className={`card border-l-4 ${s.border} p-5`}>
        <div className="flex items-start gap-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
            <Icon size={18} className={s.iconColor} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-gray-900 text-sm">{card.title}</p>
              <span className={`badge ${s.badge}`}>{card.priority}</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{card.body}</p>
            {card.action && (
              <button
                onClick={() => card.cowId
                  ? navigate('cow-detail', card.cowId)
                  : navigate(card.action === t('manageCollars2') ? 'devices' : 'health')}
                className="mt-3 text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1 hover:gap-2 transition-all"
              >
                {card.action} →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{t('advisoryTitle')}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{t('advisorySubtitle')}</p>
      </div>

      {criticals.length === 0 && warnings.length === 0 && (
        <div className="card p-6 flex items-center gap-4 border-l-4 border-l-green-500">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{t('allClear')}</p>
            <p className="text-sm text-gray-500 mt-0.5">{t('allClearMsg')}</p>
          </div>
        </div>
      )}

      {criticals.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">{t('criticalAlerts')}</h3>
          <div className="space-y-3">{criticals.map(renderCard)}</div>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-3">{t('preventiveAdvisory')}</h3>
          <div className="space-y-3">{warnings.map(renderCard)}</div>
        </div>
      )}

      {infos.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">{t('seasonalTips')}</h3>
          <div className="space-y-3">{infos.map(renderCard)}</div>
        </div>
      )}

      {/* Per-Cow AI Advisory Section */}
      {isOnline && db.cattle.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles size={12} /> AI Advisory per Cow (Backend)
          </h3>
          <div className="space-y-3">
            {db.cattle.map(cow => (
              <div key={cow.id} className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center text-sm font-bold text-purple-700">
                    {cow.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{cow.name}</p>
                    <p className="text-xs text-gray-400">{cow.breed} · {cow.health}</p>
                  </div>
                </div>
                <CowAdvisoryPanel cow={cow} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breed-Specific Advice */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('breedAdvice')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BREEDS.map(b => (
            <div key={b.name} className={`card p-4 border ${b.color}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{b.emoji}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{b.name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.badge}`}>{b.milk}</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{b.traits}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feeding Tips */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('feedingTips')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEED_TIPS.map((tip, i) => {
            const Icon = tip.icon;
            return (
              <div key={i} className="card p-4 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tip.bg}`}>
                  <Icon size={15} className={tip.color} />
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{tip.tip}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
