import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { todayStr } from '../data';

const VACCINES = ['FMD', 'HS', 'BQ', 'PPR', 'Brucellosis', 'IBR', 'Other'];

function AddVaccineModal({ cattle, onClose, onSave, t }) {
  const [form, setForm] = useState({ cowId: cattle[0]?.id || '', vaccine: 'FMD', date: todayStr(), nextDue: '', vet: '', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">{t('addVaccineRecord')}</h2>
          <button onClick={onClose} className="text-gray-400">✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('cattle2')}</label>
            <select className="select" value={form.cowId} onChange={e => set('cowId', e.target.value)}>
              {cattle.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('vaccine')}</label>
            <select className="select" value={form.vaccine} onChange={e => set('vaccine', e.target.value)}>
              {VACCINES.map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('given')}</label>
              <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('nextDue')} *</label>
              <input className="input" type="date" value={form.nextDue} onChange={e => set('nextDue', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('vet')}</label>
            <input className="input" value={form.vet} onChange={e => set('vet', e.target.value)} placeholder="Dr. Name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('notes')}</label>
            <input className="input" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional..." />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-secondary">{t('cancel')}</button>
          <button onClick={() => { if (!form.nextDue) return; onSave(form); }} className="btn-primary">{t('saveRecord')}</button>
        </div>
      </div>
    </div>
  );
}

// Compute AI risk score per cow
function aiRisk(cow, db) {
  const dev = db.devices.find(d => d.linkedCowId === cow.id);
  let score = cow.health === 'critical' ? 70 : cow.health === 'warning' ? 35 : 0;
  if (dev) {
    if (dev.temp > 39.5) score += 20;
    if (dev.activity < 30) score += 15;
  }
  return Math.min(100, score);
}

export default function Health() {
  const { db, update, navigate } = useApp();
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const today = new Date();

  const healthy  = db.cattle.filter(c => c.health === 'healthy').length;
  const warning  = db.cattle.filter(c => c.health === 'warning').length;
  const critical = db.cattle.filter(c => c.health === 'critical').length;
  const dueSoon  = db.vaccinations.filter(v => {
    const d = Math.ceil((new Date(v.nextDue) - today) / 86400000);
    return d >= 0 && d <= 30;
  }).length;

  const addVaccine = (form) => {
    update(d => { d.vaccinations.push({ id: 'VAC' + Date.now(), ...form }); return d; });
    setShowAdd(false);
  };

  const upcomingVacs = db.vaccinations
    .filter(v => { const d = Math.ceil((new Date(v.nextDue) - today) / 86400000); return d >= 0 && d <= 60; })
    .sort((a, b) => a.nextDue.localeCompare(b.nextDue)).slice(0, 8);

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {showAdd && <AddVaccineModal cattle={db.cattle} onClose={() => setShowAdd(false)} onSave={addVaccine} t={t} />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: t('healthy'),        v: healthy,  c: 'text-green-600',  bg: 'bg-green-50',  b: 'border-t-green-500' },
          { l: t('warning'),        v: warning,  c: 'text-yellow-600', bg: 'bg-yellow-50', b: 'border-t-yellow-400' },
          { l: t('critical'),       v: critical, c: 'text-red-600',    bg: 'bg-red-50',    b: 'border-t-red-500' },
          { l: t('vaccineDue30d'),  v: dueSoon,  c: 'text-purple-600', bg: 'bg-purple-50', b: 'border-t-purple-400' },
        ].map(x => (
          <div key={x.l} className={`card border-t-2 ${x.b} p-5`}>
            <p className={`text-2xl font-bold ${x.c}`}>{x.v}</p>
            <p className="text-xs text-gray-500 mt-1">{x.l}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Herd Status Table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{t('herdHealthStatus')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 font-semibold border-b border-gray-100">
                <th className="px-5 py-3 text-left">{t('cattle2')}</th>
                <th className="px-4 py-3 text-left">{t('healthStatus2')}</th>
                <th className="px-4 py-3 text-left">{t('nextVaccine')}</th>
                <th className="px-4 py-3 text-left">{t('aiRiskScore')}</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {db.cattle.map((c, i) => {
                  const lastVac = db.vaccinations.filter(v => v.cowId === c.id).sort((a, b) => b.date.localeCompare(a.date))[0];
                  const diff = lastVac ? Math.ceil((new Date(lastVac.nextDue) - today) / 86400000) : null;
                  const risk = aiRisk(c, db);
                  return (
                    <tr key={c.id} onClick={() => navigate('cow-detail', c.id)}
                      className={`cursor-pointer hover:bg-green-50/40 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center text-xs font-bold text-green-700">{c.name[0]}</div>
                          <span className="font-medium text-gray-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${c.health === 'healthy' ? 'badge-green' : c.health === 'warning' ? 'badge-yellow' : 'badge-red'}`}>{t(c.health)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {lastVac
                          ? <span className={`text-xs font-medium ${diff < 0 ? 'text-red-600' : diff < 30 ? 'text-yellow-600' : 'text-gray-600'}`}>{lastVac.nextDue}{diff < 0 ? ' ⚠️' : diff < 30 ? ' 🔔' : ''}</span>
                          : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${risk >= 60 ? 'bg-red-500' : risk >= 30 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${risk}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${risk >= 60 ? 'text-red-600' : risk >= 30 ? 'text-yellow-600' : 'text-green-600'}`}>{risk}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Vaccines */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{t('upcomingVaccinations')}</h3>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-xs py-1.5"><Plus size={13} />{t('addVaccine')}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 font-semibold border-b border-gray-100">
                <th className="px-5 py-3 text-left">{t('cattle2')}</th>
                <th className="px-4 py-3 text-left">{t('vaccine')}</th>
                <th className="px-4 py-3 text-left">{t('dueDate')}</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {upcomingVacs.length ? upcomingVacs.map(v => {
                  const cow = db.cattle.find(c => c.id === v.cowId);
                  const diff = Math.ceil((new Date(v.nextDue) - today) / 86400000);
                  return (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{cow?.name || v.cowId}</td>
                      <td className="px-4 py-3"><span className="badge badge-blue">{v.vaccine}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold ${diff < 14 ? 'text-red-600' : 'text-green-600'}`}>{v.nextDue} ({diff}d)</span></td>
                    </tr>
                  );
                }) : <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-400 text-sm">{t('noUpcomingVaccinations')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
