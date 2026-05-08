import { useEffect, useState } from 'react';
import { Plus, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useVet } from '../../context/VetContext';

const inp = { width:'100%', padding:'10px 12px', fontSize:'13px', color:'#0f172a', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box' };

const STATUS_COLOR = { scheduled:'#0284c7', completed:'#16a34a', cancelled:'#94a3b8' };
const STATUS_BG    = { scheduled:'#e0f2fe', completed:'#dcfce7', cancelled:'#f1f5f9' };

function VisitCard({ visit, onComplete, onCancel }) {
  const [completing, setCompleting] = useState(false);
  const [notes, setNotes] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const farmer = visit.farmerId;
  const isToday = visit.date === new Date().toISOString().split('T')[0];

  const doComplete = async () => {
    setCompleting(true);
    await onComplete(visit._id, notes);
    setCompleting(false); setNoteOpen(false);
  };

  return (
    <div style={{ background:'white', border:`1.5px solid ${isToday&&visit.status==='scheduled' ? '#86efac' : '#e2e8f0'}`, borderRadius:'14px', marginBottom:'8px', overflow:'hidden' }}>
      <div style={{ padding:'13px 15px', display:'flex', alignItems:'flex-start', gap:'12px' }}>
        <div style={{ width:'40px', height:'40px', background: isToday ? '#f0fdf4' : '#f8fafc', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Calendar size={16} color={isToday ? '#16a34a' : '#94a3b8'} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
            <span style={{ fontSize:'10px', fontWeight:800, color: STATUS_COLOR[visit.status], background: STATUS_BG[visit.status], padding:'2px 8px', borderRadius:'6px', textTransform:'capitalize' }}>
              {visit.status}
            </span>
            {isToday && visit.status==='scheduled' && <span style={{ fontSize:'10px', fontWeight:700, color:'#16a34a', background:'#dcfce7', padding:'2px 7px', borderRadius:'6px' }}>TODAY</span>}
            {visit.time && <span style={{ fontSize:'11px', color:'#64748b', fontWeight:600 }}>{visit.time}</span>}
            <span style={{ marginLeft:'auto', fontSize:'11px', color:'#94a3b8' }}>{visit.date}</span>
          </div>
          <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:700, color:'#0f172a' }}>{farmer?.name || 'Farmer'}</p>
          {farmer?.farmName && <p style={{ margin:'0 0 3px', fontSize:'11px', color:'#94a3b8' }}>{farmer.farmName} · {farmer.village}</p>}
          <p style={{ margin:0, fontSize:'12px', color:'#475569' }}>{visit.reason}</p>
          {visit.notes && <p style={{ margin:'4px 0 0', fontSize:'11px', color:'#64748b', fontStyle:'italic' }}>📝 {visit.notes}</p>}
        </div>
      </div>
      {visit.status === 'scheduled' && (
        <div style={{ padding:'0 15px 13px', display:'flex', gap:'8px' }}>
          <button onClick={() => setNoteOpen(o=>!o)} style={{ flex:1, padding:'7px 10px', background:'#16a34a', color:'white', border:'none', borderRadius:'9px', fontSize:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
            <CheckCircle size={13} /> Mark Done
          </button>
          <button onClick={() => onCancel(visit._id)} style={{ flex:1, padding:'7px 10px', background:'white', color:'#ef4444', border:'1.5px solid #fca5a5', borderRadius:'9px', fontSize:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
            <XCircle size={13} /> Cancel
          </button>
        </div>
      )}
      {noteOpen && (
        <div style={{ padding:'0 15px 14px', borderTop:'1px solid #f1f5f9' }}>
          <textarea style={{ ...inp, minHeight:'56px', marginBottom:'8px' }} placeholder="Add visit notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} />
          <button onClick={doComplete} disabled={completing} style={{ width:'100%', padding:'9px', background:'#16a34a', color:'white', border:'none', borderRadius:'9px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
            {completing ? 'Saving...' : 'Confirm Complete'}
          </button>
        </div>
      )}
    </div>
  );
}

function AddVisitModal({ farmers, onClose, onSubmit }) {
  const [form, setForm] = useState({ farmerId:'', date: new Date().toISOString().split('T')[0], time:'', reason:'' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const set = (k,v) => { setForm(p=>({...p,[k]:v})); setErr(''); };

  const submit = async () => {
    if (!form.farmerId || !form.date || !form.reason) return setErr('Farmer, date and reason are required.');
    setLoading(true);
    try { await onSubmit(form); onClose(); }
    catch(e) { setErr(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:'20px', padding:'1.5rem', width:'100%', maxWidth:'380px', boxShadow:'0 25px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h3 style={{ margin:0, fontSize:'1rem', fontWeight:800 }}>📅 Schedule Visit</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#94a3b8' }}>✕</button>
        </div>
        {err && <div style={{ padding:'9px 12px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'9px', fontSize:'12px', color:'#dc2626', marginBottom:'10px' }}>{err}</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          <select value={form.farmerId} onChange={e=>set('farmerId',e.target.value)} style={{ ...inp, cursor:'pointer' }}>
            <option value="">Select Farmer *</option>
            {farmers.map(f=><option key={f._id} value={f._id}>{f.name} — {f.farmName||f.phone}</option>)}
          </select>
          <input type="date" style={inp} value={form.date} onChange={e=>set('date',e.target.value)} />
          <input type="time" style={inp} value={form.time} onChange={e=>set('time',e.target.value)} placeholder="Time (optional)" />
          <textarea style={{ ...inp, minHeight:'60px' }} placeholder="Reason *" value={form.reason} onChange={e=>set('reason',e.target.value)} />
        </div>
        <button onClick={submit} disabled={loading} style={{ marginTop:'1rem', width:'100%', padding:'12px', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'white', border:'none', borderRadius:'12px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
          {loading ? 'Scheduling...' : 'Schedule Visit'}
        </button>
      </div>
    </div>
  );
}

export default function VetVisits() {
  const { visits, visitsLoading, loadVisits, farmers, loadFarmers, scheduleVisit, completeVisit, cancelVisit } = useVet();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadVisits(); loadFarmers(); }, [loadVisits, loadFarmers]);

  const filtered = visits.filter(v => {
    if (filter === 'upcoming') return v.status === 'scheduled';
    if (filter === 'done')     return v.status === 'completed';
    if (filter === 'cancelled')return v.status === 'cancelled';
    return true;
  });

  return (
    <div style={{ padding:'1.25rem 1.5rem', maxWidth:'620px', margin:'0 auto', fontFamily:"'Inter',sans-serif" }}>
      {showModal && <AddVisitModal farmers={farmers} onClose={() => setShowModal(false)} onSubmit={scheduleVisit} />}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
        <div>
          <h1 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, color:'#0f172a' }}>Visits</h1>
          <p style={{ margin:'3px 0 0', fontSize:'12px', color:'#64748b' }}>{visits.filter(v=>v.status==='scheduled').length} upcoming</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 14px', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'white', border:'none', borderRadius:'11px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
          <Plus size={14} /> Schedule
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'1rem', flexWrap:'wrap' }}>
        {[['all','All'],['upcoming','Upcoming'],['done','Done'],['cancelled','Cancelled']].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding:'6px 13px', borderRadius:'10px', border: filter===k ? '2px solid #16a34a' : '1.5px solid #e2e8f0', background: filter===k ? '#f0fdf4' : 'white', color: filter===k ? '#15803d' : '#64748b', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      {visitsLoading && <div style={{ textAlign:'center', padding:'2rem', color:'#94a3b8' }}>Loading...</div>}
      {!visitsLoading && filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📅</div>
          <p style={{ margin:0, fontSize:'14px', fontWeight:700, color:'#374151' }}>No visits found</p>
          <p style={{ margin:'6px 0 1rem', fontSize:'12px', color:'#94a3b8' }}>Schedule your first farm visit.</p>
          <button onClick={() => setShowModal(true)} style={{ padding:'10px 20px', background:'#16a34a', color:'white', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>+ Schedule Visit</button>
        </div>
      )}
      {filtered.map(v => (
        <VisitCard key={v._id} visit={v} onComplete={completeVisit} onCancel={cancelVisit} />
      ))}
    </div>
  );
}
