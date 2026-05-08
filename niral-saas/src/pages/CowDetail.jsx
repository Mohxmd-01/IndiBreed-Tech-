import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Thermometer, Activity, Battery, Signal, Syringe, MapPin, Milk, Heart, Bell, Brain } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { todayStr, timeAgo, lactLabel } from '../data';

const TABS = (t) => [
  { key: 'live',    icon: Signal,    label: t('liveData') },
  { key: 'milk',    icon: Milk,      label: t('milk') },
  { key: 'health',  icon: Heart,     label: t('health') },
  { key: 'vaccine', icon: Syringe,   label: t('vaccines') },
  { key: 'repro',   icon: '🐣',      label: t('repro') },
  { key: 'alerts',  icon: Bell,      label: t('alerts') },
  { key: 'location',icon: MapPin,    label: t('location') },
];

function RingGauge({ value, max, color, label, unit }) {
  const pct = Math.min(100, (value / max) * 100);
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8"/>
          <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{value}</span>
          <span className="text-[10px] text-gray-400">{unit}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-gray-600">{label}</p>
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

function MiniBarChart({ data }) {
  const max = Math.max(...data.map(d => d.val), 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full bg-green-500 rounded-t opacity-80" style={{ height: `${Math.max(4, Math.round((d.val / max) * 72))}px` }} />
          <span className="text-[9px] text-gray-400">{d.lbl}</span>
        </div>
      ))}
    </div>
  );
}

function AIInsightChip({ temp, activity, t }) {
  const risk = (temp > 39.5 ? 40 : temp > 39 ? 20 : 0) + (activity < 30 ? 40 : activity < 50 ? 20 : 0);
  const level = risk >= 60 ? 'critical' : risk >= 30 ? 'warning' : 'healthy';
  const cfg = {
    healthy:  { bg: 'bg-green-50', border: 'border-green-200', icon: '✅', color: 'text-green-700', msg: t('insightHealthy') },
    warning:  { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '⚠️', color: 'text-yellow-700', msg: t('insightWarning') },
    critical: { bg: 'bg-red-50', border: 'border-red-200', icon: '🚨', color: 'text-red-700', msg: t('insightCritical') },
  }[level];

  return (
    <div className={`card p-4 border ${cfg.border} ${cfg.bg} flex items-start gap-3`}>
      <div className="w-8 h-8 bg-white/60 rounded-xl flex items-center justify-center shrink-0">
        <Brain size={16} className={cfg.color} />
      </div>
      <div>
        <p className={`text-xs font-bold ${cfg.color} flex items-center gap-1`}>
          {cfg.icon} {t('aiInsight')}
          <span className="ml-1 font-normal text-[10px] px-1.5 py-0.5 bg-white/60 rounded-full">{t('riskScore')}: {risk}%</span>
        </p>
        <p className={`text-xs mt-0.5 ${cfg.color}`}>{cfg.msg}</p>
      </div>
    </div>
  );
}

export default function CowDetail() {
  const { db, navigate, selectedCowId } = useApp();
  const { t } = useTranslation();
  const [tab, setTab] = useState('live');
  const [liveData, setLiveData] = useState(null);
  const intervalRef = useRef(null);
  const cow = db.cattle.find(c => c.id === selectedCowId);
  const dev = db.devices.find(d => d.linkedCowId === selectedCowId);

  useEffect(() => {
    if (!dev) return;
    setLiveData({ temp: dev.temp, activity: dev.activity, battery: dev.battery, signal: dev.signal });
    if (tab !== 'live') return;
    intervalRef.current = setInterval(() => {
      setLiveData(prev => ({
        temp: +Math.max(37, Math.min(42, prev.temp + (Math.random() - 0.5) * 0.2)).toFixed(1),
        activity: Math.min(100, Math.max(0, Math.round(prev.activity + (Math.random() - 0.5) * 5))),
        battery: prev.battery,
        signal: prev.signal,
      }));
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [dev?.id, tab]);

  if (!cow) return null;

  const today = todayStr();
  const milkLogs = db.milkLog.filter(m => m.cowId === cow.id).sort((a, b) => a.date.localeCompare(b.date));
  const last7 = milkLogs.slice(-7);
  const chartData = last7.map(m => ({ lbl: new Date(m.date).toLocaleDateString('en-IN', { weekday: 'narrow' }), val: m.total }));
  const weekTotal  = last7.reduce((s, m) => s + m.total, 0).toFixed(1);
  const monthTotal = milkLogs.slice(-30).reduce((s, m) => s + m.total, 0).toFixed(1);

  const vacs = db.vaccinations.filter(v => v.cowId === cow.id).sort((a, b) => b.date.localeCompare(a.date));
  const reps = (db.reproductions || []).filter(r => r.cowId === cow.id).sort((a, b) => b.date.localeCompare(a.date));
  const healthHist = (db.healthHistory || []).filter(h => h.cowId === cow.id).sort((a, b) => b.date.localeCompare(a.date));
  const cowAlerts = db.alerts.filter(a => a.cowId === cow.id).sort((a, b) => b.time - a.time);

  const hBadge = cow.health === 'healthy' ? 'badge-green' : cow.health === 'warning' ? 'badge-yellow' : 'badge-red';
  const TABS_LIST = TABS(t);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <button onClick={() => navigate('cattle')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft size={16} /> {t('backToHerd')}
      </button>

      {/* Hero card */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-green-700 shrink-0">
            {cow.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{cow.name}</h2>
              {cow.pregnant && <span className="badge badge-yellow">🤰 {t('pregnant')}</span>}
              <span className={`badge ${hBadge}`}>{t(cow.health)}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span>🏷️ {cow.tagId}</span>
              <span>🐮 {cow.breed}</span>
              <span>📅 {cow.age} {t('age').toLowerCase()}</span>
              <span>⚖️ {cow.weight}kg</span>
              <span>🥛 {lactLabel(cow.lactation)}</span>
            </div>
          </div>
          {dev && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 ${dev.status === 'online' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full ${dev.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {dev.collarId} · {dev.battery}%
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS_LIST.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${tab === tb.key ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {typeof tb.icon === 'string' ? tb.icon : <tb.icon size={13} />}
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'live' && (
        <div className="space-y-4">
          {!dev ? (
            <div className="card p-12 text-center">
              <Signal size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">{t('noCollarLinked')}</p>
              <button onClick={() => navigate('devices')} className="btn-primary mx-auto mt-4">{t('addCollarBtn')}</button>
            </div>
          ) : (
            <>
              <div className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">{t('liveSensorData')}</h3>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                    {t('liveIndicator')}
                  </span>
                </div>
                <div className="flex flex-wrap justify-around gap-6">
                  <RingGauge value={liveData?.temp || dev.temp} max={42}
                    color={liveData?.temp > 39.5 ? '#ef4444' : liveData?.temp > 39 ? '#f59e0b' : '#22c55e'}
                    label={t('bodyTemp')} unit="°C" />
                  <RingGauge value={liveData?.activity || dev.activity} max={100}
                    color={liveData?.activity > 60 ? '#22c55e' : liveData?.activity > 30 ? '#f59e0b' : '#ef4444'}
                    label={t('activity')} unit="%" />
                </div>
              </div>

              {/* AI Insight */}
              <AIInsightChip temp={liveData?.temp || dev.temp} activity={liveData?.activity || dev.activity} t={t} />

              <div className="grid grid-cols-2 gap-4">
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Battery size={16} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{t('battery')}</span>
                    <span className="ml-auto text-sm font-bold" style={{ color: dev.battery >= 60 ? '#22c55e' : dev.battery >= 30 ? '#f59e0b' : '#ef4444' }}>{dev.battery}%</span>
                  </div>
                  <ProgressBar value={dev.battery} max={100} color={dev.battery >= 60 ? 'bg-green-500' : dev.battery >= 30 ? 'bg-yellow-400' : 'bg-red-500'} />
                  <p className="text-xs text-gray-400 mt-2">{t('lastSync')}: {timeAgo(dev.lastSync)}</p>
                </div>
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Signal size={16} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">{t('signal')}</span>
                    <span className="ml-auto text-sm font-bold text-blue-600">{dev.signal}%</span>
                  </div>
                  <ProgressBar value={dev.signal} max={100} color="bg-blue-500" />
                  <p className="text-xs text-gray-400 mt-2">FW: {dev.firmware}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'milk' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[{ l: t('thisWeek'), v: weekTotal + 'L' }, { l: t('thisMonth'), v: monthTotal + 'L' }, { l: t('dailyAvg'), v: cow.milkAvg + 'L' }].map(x => (
              <div key={x.l} className="card p-4 text-center">
                <p className="text-xl font-bold text-gray-900">{x.v}</p>
                <p className="text-xs text-gray-500 mt-1">{x.l}</p>
              </div>
            ))}
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('last7Days')}</h3>
            <MiniBarChart data={chartData} />
          </div>
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">{t('dailyRecords')}</h3></div>
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 font-semibold">
                <th className="px-5 py-2.5 text-left">{t('date')}</th>
                <th className="px-4 py-2.5 text-left">{t('morning')}</th>
                <th className="px-4 py-2.5 text-left">{t('evening')}</th>
                <th className="px-4 py-2.5 text-left font-bold text-gray-700">{t('total')}</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {last7.slice().reverse().map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{m.date}</td>
                    <td className="px-4 py-3 text-gray-600">{m.morning}L</td>
                    <td className="px-4 py-3 text-gray-600">{m.evening}L</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{m.total}L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'health' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('healthTimeline')}</h3>
            {healthHist.length ? (
              <div className="space-y-4">
                {healthHist.map((h, i) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                      {i < healthHist.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-semibold text-gray-900">{h.issue}</p>
                      <p className="text-xs text-gray-500">{h.date} · {h.vet}</p>
                      <p className="text-xs text-gray-600 mt-1">{h.treatment}</p>
                      {h.notes && <p className="text-xs text-gray-400 mt-0.5">{h.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">{t('noHealthRecords')}</p>}
          </div>
        </div>
      )}

      {tab === 'vaccine' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">{t('vaccinationRecords')}</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-xs text-gray-500 font-semibold">
              <th className="px-5 py-2.5 text-left">{t('vaccine')}</th>
              <th className="px-4 py-2.5 text-left">{t('given')}</th>
              <th className="px-4 py-2.5 text-left">{t('nextDue')}</th>
              <th className="px-4 py-2.5 text-left">{t('vet')}</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {vacs.length ? vacs.map(v => {
                const diff = Math.ceil((new Date(v.nextDue) - new Date()) / 86400000);
                return (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-semibold text-gray-900">{v.vaccine}</td>
                    <td className="px-4 py-3 text-gray-600">{v.date}</td>
                    <td className="px-4 py-3"><span className={`badge ${diff < 0 ? 'badge-red' : diff < 30 ? 'badge-yellow' : 'badge-green'}`}>{v.nextDue}</span></td>
                    <td className="px-4 py-3 text-gray-600">{v.vet}</td>
                  </tr>
                );
              }) : <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 text-sm">{t('vaccinationRecords')}...</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'repro' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('reproductionHistory')}</h3>
          {cow.pregnant && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-xs font-semibold text-yellow-700">🤰 {t('currentlyPregnant')}</div>}
          {reps.length ? (
            <div className="space-y-3">
              {reps.map(r => (
                <div key={r.id} className="p-3.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${r.type === 'calving' ? 'badge-green' : r.type === 'AI' ? 'badge-blue' : 'badge-yellow'}`}>{r.type.toUpperCase()}</span>
                    <span className="text-xs text-gray-500">{r.date}</span>
                    {r.type === 'AI' && <span className={`badge ${r.success ? 'badge-green' : 'badge-red'} ml-auto`}>{r.success ? 'Success' : 'Failed'}</span>}
                  </div>
                  <p className="text-xs text-gray-700">{r.notes}</p>
                  {r.bull && <p className="text-xs text-gray-400 mt-0.5">Bull: {r.bull}</p>}
                  {r.calf && <p className="text-xs text-gray-400 mt-0.5">Calf: {r.calf}, {r.calfWeight}kg</p>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">{t('noReproRecords')}</p>}
        </div>
      )}

      {tab === 'alerts' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('alertsHistory')}</h3>
          {cowAlerts.length ? (
            <div className="space-y-3">
              {cowAlerts.map(a => (
                <div key={a.id} className={`flex items-start gap-3 p-3.5 rounded-xl ${a.resolved ? 'bg-gray-50 opacity-70' : a.type === 'critical' ? 'bg-red-50' : a.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.type === 'critical' ? 'bg-red-500' : a.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{a.desc}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(a.time)} {a.resolved ? '· ✓ Resolved' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">{t('noAlertRecords')}</p>}
        </div>
      )}

      {tab === 'location' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('gpsLocation')}</h3>
          {dev?.lat ? (
            <>
              <div className="bg-green-50 rounded-xl overflow-hidden border border-green-100 mb-4" style={{ height: 240 }}>
                <svg width="100%" height="240" style={{ background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)' }}>
                  <rect x="20" y="20" width="calc(100%-40)" height="200" rx="10" fill="none" stroke="#86efac" strokeWidth="1.5" strokeDasharray="6,3" />
                  <rect x="40" y="40" width="180" height="80" rx="8" fill="rgba(34,197,94,0.1)" stroke="#86efac" strokeWidth="1" />
                  <text x="130" y="80" textAnchor="middle" fontSize="11" fill="#16a34a" fontWeight="600">Grazing Field A</text>
                  <rect x="240" y="40" width="200" height="80" rx="8" fill="rgba(59,130,246,0.08)" stroke="#86efac" strokeWidth="1" />
                  <text x="340" y="80" textAnchor="middle" fontSize="11" fill="#16a34a" fontWeight="600">Grazing Field B</text>
                  <circle cx="150" cy="180" r="16" fill="#16a34a" opacity="0.15"><animate attributeName="r" values="16;24;16" dur="2s" repeatCount="indefinite" /></circle>
                  <circle cx="150" cy="180" r="10" fill="#16a34a" />
                  <text x="150" y="184" textAnchor="middle" fontSize="12" fill="white">🐄</text>
                  <text x="150" y="202" textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">{cow.name}</text>
                </svg>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>📍 {dev.lat.toFixed(4)}, {dev.lng.toFixed(4)}</span>
                <span>🕐 {timeAgo(dev.lastSync)}</span>
              </div>
            </>
          ) : <div className="text-center py-12"><MapPin size={40} className="text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">{t('gpsNotAvailable')}</p></div>}
        </div>
      )}
    </div>
  );
}
