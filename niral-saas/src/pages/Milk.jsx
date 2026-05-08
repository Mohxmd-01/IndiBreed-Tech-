import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { todayStr, fmt } from '../data';

export default function Milk() {
  const { db, update } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ cowId: db.cattle[0]?.id||'', morning:'', evening:'', date:todayStr() });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const today = todayStr();
  const weekStart = new Date(Date.now()-6*86400000).toISOString().split('T')[0];
  const monthStart = new Date(Date.now()-29*86400000).toISOString().split('T')[0];
  const todayL = db.milkLog.filter(m=>m.date===today).reduce((s,m)=>s+m.total,0);
  const weekL = db.milkLog.filter(m=>m.date>=weekStart).reduce((s,m)=>s+m.total,0);
  const monthL = db.milkLog.filter(m=>m.date>=monthStart).reduce((s,m)=>s+m.total,0);
  const todayLogs = db.milkLog.filter(m=>m.date===today);
  const topCow = db.cattle.reduce((b,c)=>{ const t=todayLogs.filter(m=>m.cowId===c.id).reduce((s,m)=>s+m.total,0); return t>(b.val||0)?{name:c.name,val:t}:b; },{});

  const days=[];
  for(let i=6;i>=0;i--){const dt=new Date(Date.now()-i*86400000);const ds=dt.toISOString().split('T')[0];const v=db.milkLog.filter(m=>m.date===ds).reduce((s,m)=>s+m.total,0);days.push({lbl:dt.toLocaleDateString('en-IN',{weekday:'short'}),val:+v.toFixed(1)});}
  const maxV = Math.max(...days.map(d=>d.val),1);

  const recordMilk = () => {
    const m=+form.morning||0, e=+form.evening||0;
    if(!m&&!e) return;
    update(d=>{
      const ex=d.milkLog.find(x=>x.cowId===form.cowId&&x.date===form.date);
      if(ex){ex.morning=m;ex.evening=e;ex.total=+(m+e).toFixed(1);}
      else d.milkLog.push({id:'ML-'+Date.now(),cowId:form.cowId,date:form.date,morning:m,evening:e,total:+(m+e).toFixed(1)});
      return d;
    });
    setShowModal(false); setForm(p=>({...p,morning:'',evening:''}));
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowModal(false)}/>
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between"><h2 className="font-semibold text-gray-900">Record Milk Yield</h2><button onClick={()=>setShowModal(false)} className="text-gray-400">✕</button></div>
            <div className="p-5 space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Cattle</label><select className="select" value={form.cowId} onChange={e=>set('cowId',e.target.value)}>{db.cattle.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Morning (L)</label><input className="input" type="number" value={form.morning} onChange={e=>set('morning',e.target.value)} step="0.1" min="0"/></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Evening (L)</label><input className="input" type="number" value={form.evening} onChange={e=>set('evening',e.target.value)} step="0.1" min="0"/></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Date</label><input className="input" type="date" value={form.date} onChange={e=>set('date',e.target.value)}/></div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={()=>setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={recordMilk} className="btn-primary">Save Record</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{l:"Today's Total",v:todayL.toFixed(1)+'L'},{l:'This Week',v:weekL.toFixed(1)+'L'},{l:'This Month',v:monthL.toFixed(1)+'L'},{l:'Top Producer',v:topCow.name||'—'}].map(x=>(
          <div key={x.l} className="stat-card"><p className="text-xs text-gray-500 mb-1">{x.l}</p><p className="text-2xl font-bold text-gray-900">{x.v}</p></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Weekly Yield</h3>
            <button onClick={()=>setShowModal(true)} className="btn-primary text-xs py-1.5"><Plus size={13}/>Record Milk</button>
          </div>
          <div className="flex items-end gap-2 h-24">
            {days.map((d,i)=>(
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-gray-500 font-medium">{d.val}L</span>
                <div className="w-full bg-green-500 rounded-t opacity-80 hover:opacity-100 transition-opacity" style={{height:`${Math.max(4,Math.round((d.val/maxV)*72))}px`}}/>
                <span className="text-[10px] text-gray-400">{d.lbl}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Record</h3>
          <p className="text-xs text-gray-500 mb-4">Log morning and evening yield for any cow</p>
          <button onClick={()=>setShowModal(true)} className="btn-primary w-full justify-center"><Plus size={16}/>Record Now</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-900">Per Cow Yield</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-xs text-gray-500 font-semibold border-b border-gray-100"><th className="px-5 py-3 text-left">Cattle</th><th className="px-4 py-3 text-left">Breed</th><th className="px-4 py-3 text-left">Today</th><th className="px-4 py-3 text-left">7-Day Avg</th><th className="px-4 py-3 text-left">Trend</th></tr></thead>
            <tbody className="divide-y divide-gray-50">
              {db.cattle.filter(c=>c.lactation>0).map((c,i)=>{
                const t=todayLogs.filter(m=>m.cowId===c.id).reduce((s,m)=>s+m.total,0).toFixed(1);
                const wk=db.milkLog.filter(m=>m.date>=weekStart&&m.cowId===c.id).reduce((s,m)=>s+m.total,0);
                const avg=(wk/7).toFixed(1);
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 ${i%2===0?'':'bg-gray-50/40'}`}>
                    <td className="px-5 py-3 font-semibold text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.breed}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{t}L</td>
                    <td className="px-4 py-3 text-gray-600">{avg}L</td>
                    <td className="px-4 py-3">{+t>=+avg?<span className="text-green-600 text-xs font-semibold">↑ Up</span>:<span className="text-red-500 text-xs font-semibold">↓ Down</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
