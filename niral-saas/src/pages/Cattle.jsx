import { useState } from 'react';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { todayStr, lactLabel } from '../data';

const BREEDS = ['Gir','HF Cross','Sahiwal','Murrah Buffalo','Jersey Cross','Tharparkar','Rathi','Kankrej','Other'];

function AddCattleModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', tagId:'', breed:'Gir', age:'', weight:'', lactation:'0', health:'healthy', pregnant:false, notes:'' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Add New Cattle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label><input className="input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Lakshmi"/></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Tag ID</label><input className="input" value={form.tagId} onChange={e=>set('tagId',e.target.value)} placeholder="TAG-009"/></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Breed</label><select className="select" value={form.breed} onChange={e=>set('breed',e.target.value)}>{BREEDS.map(b=><option key={b}>{b}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Age (yrs)</label><input className="input" type="number" value={form.age} onChange={e=>set('age',e.target.value)} min="0" max="20"/></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label><input className="input" type="number" value={form.weight} onChange={e=>set('weight',e.target.value)} min="50"/></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Lactation</label>
              <select className="select" value={form.lactation} onChange={e=>set('lactation',e.target.value)}>
                <option value="0">Dry</option><option value="1">1st</option><option value="2">2nd</option><option value="3">3rd</option><option value="4">4th+</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Health</label>
              <select className="select" value={form.health} onChange={e=>set('health',e.target.value)}>
                <option value="healthy">Healthy</option><option value="warning">Warning</option><option value="critical">Critical</option>
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="preg" checked={form.pregnant} onChange={e=>set('pregnant',e.target.checked)} className="rounded"/>
              <label htmlFor="preg" className="text-sm text-gray-700">Pregnant</label>
            </div>
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label><input className="input" value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Optional..."/></div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={() => { if(!form.name.trim()) return; onSave(form); }} className="btn-primary">Save Cattle</button>
        </div>
      </div>
    </div>
  );
}

export default function Cattle() {
  const { db, update, navigate, searchQuery } = useApp();
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const today = todayStr();

  const filters = [
    { key:'all', label:'All' },
    { key:'healthy', label:'Healthy' },
    { key:'warning', label:'Warning' },
    { key:'critical', label:'Critical' },
    { key:'pregnant', label:'Pregnant' },
  ];

  const list = db.cattle.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.breed.toLowerCase().includes(q) || c.tagId.toLowerCase().includes(q);
    const matchF = filter === 'all' || (filter === 'pregnant' ? c.pregnant : c.health === filter);
    return matchQ && matchF;
  });

  const addCattle = (form) => {
    update(d => {
      d.cattle.push({ id:'COW'+Date.now(), name:form.name, tagId:form.tagId||'TAG-'+Date.now().toString().slice(-3), breed:form.breed, age:+form.age||3, weight:+form.weight||350, lactation:+form.lactation, health:form.health, pregnant:form.pregnant, collarId:null, milkAvg:0, notes:form.notes });
      return d;
    });
    setShowAdd(false);
  };

  const deleteCattle = (id, name) => {
    if (!confirm(`Delete ${name}?`)) return;
    update(d => { d.cattle = d.cattle.filter(c => c.id !== id); return d; });
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {showAdd && <AddCattleModal onClose={() => setShowAdd(false)} onSave={addCattle} />}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${filter===f.key?'bg-green-600 text-white':'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary sm:ml-auto shrink-0"><Plus size={16}/>Add Cattle</button>
      </div>

      {list.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-sm">No cattle found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map(c => {
            const milk = db.milkLog.filter(m => m.date === today && m.cowId === c.id).reduce((s, m) => s + m.total, 0).toFixed(1);
            const dev = db.devices.find(d => d.linkedCowId === c.id);
            const hColor = c.health === 'healthy' ? 'border-l-green-500' : c.health === 'warning' ? 'border-l-yellow-400' : 'border-l-red-500';
            return (
              <div key={c.id} onClick={() => navigate('cow-detail', c.id)}
                className={`card border-l-4 ${hColor} p-5 cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center font-bold text-green-700">{c.name[0]}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{c.name} {c.pregnant && <span className="text-xs">🤰</span>}</p>
                      <p className="text-xs text-gray-400">{c.tagId}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                    <button onClick={() => deleteCattle(c.id, c.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14}/>
                    </button>
                    <ChevronRight size={18} className="text-gray-300 mt-0.5"/>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="badge badge-gray">{c.breed}</span>
                  <span className="badge badge-gray">{c.age}yr</span>
                  <span className="badge badge-gray">{lactLabel(c.lactation)}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{milk}L</p>
                    <p className="text-[10px] text-gray-400">today</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge ${c.health==='healthy'?'badge-green':c.health==='warning'?'badge-yellow':'badge-red'}`}>{c.health}</span>
                    {dev ? (
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${dev.status==='online'?'bg-green-500':'bg-gray-300'}`}/>
                        {dev.collarId}
                      </p>
                    ) : <p className="text-[10px] text-gray-300 mt-1">No collar</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
