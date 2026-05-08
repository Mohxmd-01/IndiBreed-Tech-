import { useEffect, useState } from 'react';
import { Plus, Stethoscope, ChevronRight } from 'lucide-react';
import { useVet } from '../../context/VetContext';

const inp = { width:'100%', padding:'10px 12px', fontSize:'13px', color:'#0f172a', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box' };
const sel = { ...inp, cursor:'pointer' };

const OUTCOME_COLOR = { ongoing:'#d97706', recovered:'#16a34a', worsened:'#dc2626', referred:'#7c3aed' };
const OUTCOME_BG    = { ongoing:'#fef3c7', recovered:'#dcfce7', worsened:'#fee2e2', referred:'#f3e8ff' };

function TreatmentCard({ t }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:'white', border:'1.5px solid #e2e8f0', borderRadius:'14px', marginBottom:'8px', overflow:'hidden', transition:'all 0.2s' }}>
      <button onClick={() => setOpen(o=>!o)} style={{ width:'100%', padding:'13px 15px', display:'flex', alignItems:'center', gap:'12px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}>
        <div style={{ width:'38px', height:'38px', background:'#f0f9ff', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Stethoscope size={16} color="#0284c7" />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:700, color:'#0f172a' }}>🐄 {t.cowName}</p>
          <p style={{ margin:0, fontSize:'11px', color:'#64748b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.diagnosis}</p>
          {t.farmerId && <p style={{ margin:'1px 0 0', fontSize:'10px', color:'#94a3b8' }}>Farmer: {t.farmerId.name || t.farmerId}</p>}
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px', flexShrink:0 }}>
          <span style={{ fontSize:'10px', fontWeight:700, color: OUTCOME_COLOR[t.outcome]||'#64748b', background: OUTCOME_BG[t.outcome]||'#f1f5f9', padding:'2px 8px', borderRadius:'6px', textTransform:'capitalize' }}>{t.outcome}</span>
          <span style={{ fontSize:'10px', color:'#94a3b8' }}>{t.date}</span>
        </div>
        <ChevronRight size={14} color="#94a3b8" style={{ transform: open ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{ padding:'0 15px 14px', borderTop:'1px solid #f1f5f9' }}>
          {t.medicines?.length > 0 && (
            <div style={{ marginTop:'10px' }}>
              <p style={{ margin:'0 0 5px', fontSize:'11px', fontWeight:700, color:'#374151' }}>💊 Medicines</p>
              {t.medicines.map((m,i) => <p key={i} style={{ margin:'0 0 2px', fontSize:'12px', color:'#475569' }}>• {m.name}{m.dose ? ` — ${m.dose}` : ''}{m.days ? ` (${m.days}d)` : ''}</p>)}
            </div>
          )}
          {t.notes && <p style={{ margin:'8px 0 0', fontSize:'12px', color:'#475569' }}>📝 {t.notes}</p>}
          {t.followUpDate && <p style={{ margin:'6px 0 0', fontSize:'11px', color:'#0284c7', fontWeight:600 }}>📅 Follow-up: {t.followUpDate}</p>}
        </div>
      )}
    </div>
  );
}

function AddTreatmentModal({ farmers, onClose, onSubmit }) {
  const [form, setForm] = useState({ farmerId:'', cowId:'', cowName:'', diagnosis:'', medicines:'', notes:'', followUpDate:'', outcome:'ongoing' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const set = (k,v) => { setForm(p=>({...p,[k]:v})); setErr(''); };

  const submit = async () => {
    if (!form.farmerId || !form.cowId || !form.diagnosis) return setErr('Farmer, Cow ID and Diagnosis are required.');
    setLoading(true);
    try {
      const meds = form.medicines ? [{ name: form.medicines, dose:'', days:3 }] : [];
      await onSubmit({ ...form, medicines: meds });
      onClose();
    } catch(e) { setErr(e.response?.data?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:'20px', padding:'1.5rem', width:'100%', maxWidth:'440px', maxHeight:'92vh', overflowY:'auto', boxShadow:'0 25px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h3 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'#0f172a' }}>🩺 New Treatment Record</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#94a3b8' }}>✕</button>
        </div>
        {err && <div style={{ padding:'9px 12px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'9px', fontSize:'12px', color:'#dc2626', marginBottom:'12px' }}>{err}</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          <select value={form.farmerId} onChange={e=>set('farmerId',e.target.value)} style={sel}>
            <option value="">Select Farmer *</option>
            {farmers.map(f=><option key={f._id} value={f._id}>{f.name} — {f.farmName||f.phone}</option>)}
          </select>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <input style={inp} placeholder="Cow ID *" value={form.cowId} onChange={e=>set('cowId',e.target.value)} />
            <input style={inp} placeholder="Cow Name" value={form.cowName} onChange={e=>set('cowName',e.target.value)} />
          </div>
          <textarea style={{ ...inp, minHeight:'70px', resize:'vertical' }} placeholder="Diagnosis *" value={form.diagnosis} onChange={e=>set('diagnosis',e.target.value)} />
          <input style={inp} placeholder="Medicine (name)" value={form.medicines} onChange={e=>set('medicines',e.target.value)} />
          <input style={inp} placeholder="Notes" value={form.notes} onChange={e=>set('notes',e.target.value)} />
          <input type="date" style={inp} value={form.followUpDate} onChange={e=>set('followUpDate',e.target.value)} title="Follow-up Date" />
          <select value={form.outcome} onChange={e=>set('outcome',e.target.value)} style={sel}>
            <option value="ongoing">Ongoing</option>
            <option value="recovered">Recovered</option>
            <option value="worsened">Worsened</option>
            <option value="referred">Referred</option>
          </select>
        </div>
        <button onClick={submit} disabled={loading} style={{ marginTop:'1rem', width:'100%', padding:'12px', background:'linear-gradient(135deg,#1e40af,#1d4ed8)', color:'white', border:'none', borderRadius:'12px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
          {loading ? 'Saving...' : 'Save Treatment Record'}
        </button>
      </div>
    </div>
  );
}

export default function VetTreatments() {
  const { treatments, treatmentsLoading, loadTreatments, farmers, loadFarmers, addTreatment } = useVet();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { loadTreatments(); loadFarmers(); }, [loadTreatments, loadFarmers]);

  return (
    <div style={{ padding:'1.25rem 1.5rem', maxWidth:'620px', margin:'0 auto', fontFamily:"'Inter',sans-serif" }}>
      {showModal && <AddTreatmentModal farmers={farmers} onClose={() => setShowModal(false)} onSubmit={addTreatment} />}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
        <div>
          <h1 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, color:'#0f172a' }}>Treatments</h1>
          <p style={{ margin:'3px 0 0', fontSize:'12px', color:'#64748b' }}>{treatments.length} records</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 14px', background:'linear-gradient(135deg,#1e40af,#1d4ed8)', color:'white', border:'none', borderRadius:'11px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
          <Plus size={14} /> Add Record
        </button>
      </div>
      {treatmentsLoading && <div style={{ textAlign:'center', padding:'2rem', color:'#94a3b8' }}>Loading...</div>}
      {!treatmentsLoading && treatments.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📋</div>
          <p style={{ margin:0, fontSize:'14px', fontWeight:700, color:'#374151' }}>No treatment records yet</p>
          <p style={{ margin:'6px 0 1rem', fontSize:'12px', color:'#94a3b8' }}>Add your first diagnosis and treatment record.</p>
          <button onClick={() => setShowModal(true)} style={{ padding:'10px 20px', background:'#1e40af', color:'white', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>
            + Add Treatment
          </button>
        </div>
      )}
      {treatments.map(t => <TreatmentCard key={t._id} t={t} />)}
    </div>
  );
}
