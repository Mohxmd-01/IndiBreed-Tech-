import { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, Stethoscope, Phone, RefreshCw, ClipboardList, CheckCircle, Plus } from 'lucide-react';
import { useVet } from '../../context/VetContext';

const PRIORITY_COLOR = {
  critical: { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', dot: '#ef4444' },
  high:     { bg: '#fffbeb', border: '#fde68a', badge: '#d97706', dot: '#f59e0b' },
  medium:   { bg: '#f0f9ff', border: '#bae6fd', badge: '#0284c7', dot: '#38bdf8' },
  low:      { bg: '#f8fafc', border: '#e2e8f0', badge: '#64748b', dot: '#94a3b8' },
};

function UrgentCard({ alert, onDiagnose, onSchedule }) {
  const p = alert.priority || 'high';
  const c = PRIORITY_COLOR[p] || PRIORITY_COLOR.high;
  const farmer = alert.userId;
  return (
    <div style={{ padding:'14px 16px', background: c.bg, border:`1.5px solid ${c.border}`, borderRadius:'14px', marginBottom:'10px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
        <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: c.dot, flexShrink:0, animation: p==='critical'?'pulse 1.5s ease-in-out infinite':undefined }} />
        <span style={{ fontSize:'10px', fontWeight:800, letterSpacing:'0.06em', color: c.badge, textTransform:'uppercase' }}>{p}</span>
        {alert.actionRequired && <span style={{ fontSize:'10px', fontWeight:700, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', padding:'1px 7px', borderRadius:'6px' }}>ACTION REQUIRED</span>}
        <span style={{ marginLeft:'auto', fontSize:'11px', color:'#94a3b8' }}>{new Date(alert.time||alert.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      <p style={{ margin:'0 0 2px', fontSize:'14px', fontWeight:700, color:'#0f172a' }}>{alert.title}</p>
      {alert.cowName && <p style={{ margin:'0 0 3px', fontSize:'11px', color:'#94a3b8', fontWeight:600 }}>🐄 {alert.cowName}</p>}
      <p style={{ margin:'0 0 8px', fontSize:'12px', color:'#475569', lineHeight:1.5 }}>{alert.desc}</p>
      {alert.impactRs > 0 && (
        <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'8px', padding:'3px 10px', marginBottom:'10px' }}>
          <span style={{ fontSize:'11px', fontWeight:700, color:'#b91c1c' }}>💸 Est. loss: ₹{alert.impactRs}/day if untreated</span>
        </div>
      )}
      {farmer && (
        <p style={{ margin:'0 0 10px', fontSize:'12px', color:'#64748b' }}>
          👤 Farmer: <strong>{farmer.name || farmer.phone}</strong>
          {farmer.farmName && ` — ${farmer.farmName}`}
        </p>
      )}
      <div style={{ display:'flex', gap:'8px' }}>
        <button onClick={() => onDiagnose(alert)} style={{ flex:1, padding:'7px 10px', background:'#1e40af', color:'white', border:'none', borderRadius:'9px', fontSize:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
          <ClipboardList size={13} /> Add Diagnosis
        </button>
        <button onClick={() => onSchedule(alert)} style={{ flex:1, padding:'7px 10px', background:'white', color:'#374151', border:'1.5px solid #e2e8f0', borderRadius:'9px', fontSize:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}>
          <Calendar size={13} /> Schedule Visit
        </button>
        {farmer?.phone && (
          <a href={`tel:${farmer.phone}`} style={{ padding:'7px 10px', background:'#f0fdf4', color:'#16a34a', border:'1.5px solid #bbf7d0', borderRadius:'9px', fontSize:'12px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', textDecoration:'none' }}>
            <Phone size={13} />
          </a>
        )}
      </div>
    </div>
  );
}

function VisitCard({ visit, onComplete, onCancel }) {
  const farmer = visit.farmerId;
  const isToday = visit.date === new Date().toISOString().split('T')[0];
  return (
    <div style={{ padding:'13px 15px', background: isToday ? '#f0fdf4' : 'white', border:`1.5px solid ${isToday ? '#86efac' : '#e2e8f0'}`, borderRadius:'13px', marginBottom:'8px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px' }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
            <span style={{ fontSize:'10px', fontWeight:800, color: isToday ? '#16a34a' : '#64748b', background: isToday ? '#dcfce7' : '#f1f5f9', padding:'2px 7px', borderRadius:'6px' }}>
              {isToday ? '📅 TODAY' : visit.date}
            </span>
            {visit.time && <span style={{ fontSize:'11px', color:'#64748b', fontWeight:600 }}>{visit.time}</span>}
          </div>
          <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:700, color:'#0f172a' }}>{farmer?.name || 'Farmer'}</p>
          {farmer?.farmName && <p style={{ margin:'0 0 2px', fontSize:'11px', color:'#94a3b8' }}>{farmer.farmName} · {farmer.village}</p>}
          <p style={{ margin:0, fontSize:'12px', color:'#475569' }}>{visit.reason}</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
          {visit.status === 'scheduled' && (
            <>
              <button onClick={() => onComplete(visit._id)} style={{ padding:'5px 10px', background:'#16a34a', color:'white', border:'none', borderRadius:'7px', fontSize:'11px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', whiteSpace:'nowrap' }}>
                <CheckCircle size={11} /> Done
              </button>
              <button onClick={() => onCancel(visit._id)} style={{ padding:'5px 10px', background:'white', color:'#ef4444', border:'1px solid #fca5a5', borderRadius:'7px', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>Cancel</button>
            </>
          )}
          {visit.status === 'completed' && <span style={{ fontSize:'11px', color:'#16a34a', fontWeight:700 }}>✓ Done</span>}
          {visit.status === 'cancelled' && <span style={{ fontSize:'11px', color:'#94a3b8', fontWeight:600 }}>Cancelled</span>}
        </div>
      </div>
    </div>
  );
}

// Mini modal for adding treatment from alert
function DiagnoseModal({ alert, farmers, onClose, onSubmit }) {
  const [form, setForm] = useState({ farmerId: alert?.userId?._id || '', cowId: alert?.cowId || '', cowName: alert?.cowName || '', diagnosis: '', medicines: '', notes: '', followUpDate: '', outcome: 'ongoing' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!form.farmerId || !form.diagnosis) return;
    setLoading(true);
    try {
      const payload = { ...form, medicines: form.medicines ? [{ name: form.medicines, dose: '', days: 3 }] : [], alertId: alert?._id };
      await onSubmit(payload);
      onClose();
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:'20px', padding:'1.5rem', width:'100%', maxWidth:'440px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 25px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h3 style={{ margin:0, fontSize:'1rem', fontWeight:800, color:'#0f172a' }}>🩺 Add Diagnosis</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#94a3b8' }}>✕</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {!form.farmerId && (
            <select value={form.farmerId} onChange={e => set('farmerId', e.target.value)} style={sel}>
              <option value="">Select Farmer *</option>
              {farmers.map(f => <option key={f._id} value={f._id}>{f.name} — {f.farmName}</option>)}
            </select>
          )}
          <input style={inp} placeholder="Cow ID *" value={form.cowId} onChange={e => set('cowId', e.target.value)} />
          <input style={inp} placeholder="Cow Name" value={form.cowName} onChange={e => set('cowName', e.target.value)} />
          <textarea style={{ ...inp, minHeight:'70px', resize:'vertical' }} placeholder="Diagnosis *" value={form.diagnosis} onChange={e => set('diagnosis', e.target.value)} />
          <input style={inp} placeholder="Medicine (name)" value={form.medicines} onChange={e => set('medicines', e.target.value)} />
          <input style={inp} placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
          <input style={inp} type="date" placeholder="Follow-up Date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} />
          <select value={form.outcome} onChange={e => set('outcome', e.target.value)} style={sel}>
            <option value="ongoing">Ongoing</option>
            <option value="recovered">Recovered</option>
            <option value="worsened">Worsened</option>
            <option value="referred">Referred</option>
          </select>
        </div>
        <button onClick={submit} disabled={loading} style={{ marginTop:'1rem', width:'100%', padding:'12px', background:'linear-gradient(135deg,#1e40af,#1d4ed8)', color:'white', border:'none', borderRadius:'12px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
          {loading ? 'Saving...' : 'Save Diagnosis'}
        </button>
      </div>
    </div>
  );
}

const inp = { width:'100%', padding:'10px 12px', fontSize:'13px', color:'#0f172a', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontFamily:"'Inter',sans-serif", outline:'none', boxSizing:'border-box' };
const sel = { ...inp, cursor:'pointer' };

export default function VetFeed() {
  const { feed, feedLoading, feedError, loadFeed, farmers, loadFarmers, addTreatment, scheduleVisit, completeVisit, cancelVisit, navigate } = useVet();
  const [diagnoseAlert, setDiagnoseAlert] = useState(null);
  const [scheduleAlert, setScheduleAlert] = useState(null);
  const [visitForm, setVisitForm] = useState({ date:'', time:'', reason:'' });
  const [visitModal, setVisitModal] = useState(false);
  const [visitLoading, setVisitLoading] = useState(false);

  useEffect(() => { loadFarmers(); }, [loadFarmers]);

  const urgent = feed.urgentCases || [];
  const todayVisits = feed.todayVisits || [];
  const allVisits = [...todayVisits].filter(v => v.status === 'scheduled');

  const openSchedule = (alert) => {
    setScheduleAlert(alert);
    setVisitForm({ date: new Date().toISOString().split('T')[0], time:'', reason: alert?.title || '' });
    setVisitModal(true);
  };

  const submitVisit = async () => {
    if (!scheduleAlert || !visitForm.date || !visitForm.reason) return;
    setVisitLoading(true);
    try {
      await scheduleVisit({ farmerId: scheduleAlert.userId?._id || scheduleAlert.userId, ...visitForm });
      setVisitModal(false);
    } catch { /* ignore */ } finally { setVisitLoading(false); }
  };

  if (feed.linkedFarmers === 0 && !feedLoading) {
    return (
      <div style={{ padding:'2rem 1.5rem', maxWidth:'500px', margin:'0 auto', fontFamily:"'Inter',sans-serif", textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔗</div>
        <h2 style={{ margin:'0 0 8px', fontSize:'1.25rem', fontWeight:800, color:'#0f172a' }}>No linked farmers yet</h2>
        <p style={{ margin:'0 0 1.5rem', fontSize:'13px', color:'#64748b' }}>Link with farmers to start seeing their urgent cases.</p>
        <button onClick={() => navigate('link')} style={{ padding:'12px 24px', background:'linear-gradient(135deg,#16a34a,#15803d)', color:'white', border:'none', borderRadius:'12px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
          + Link a Farmer
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding:'1.25rem 1.5rem', maxWidth:'620px', margin:'0 auto', fontFamily:"'Inter',sans-serif" }}>
      {diagnoseAlert && (
        <DiagnoseModal alert={diagnoseAlert} farmers={farmers} onClose={() => setDiagnoseAlert(null)} onSubmit={addTreatment} />
      )}
      {visitModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'white', borderRadius:'20px', padding:'1.5rem', width:'100%', maxWidth:'380px', boxShadow:'0 25px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
              <h3 style={{ margin:0, fontSize:'1rem', fontWeight:800 }}>📅 Schedule Visit</h3>
              <button onClick={() => setVisitModal(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#94a3b8' }}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <input type="date" style={inp} value={visitForm.date} onChange={e => setVisitForm(p=>({...p,date:e.target.value}))} />
              <input type="time" style={inp} value={visitForm.time} onChange={e => setVisitForm(p=>({...p,time:e.target.value}))} placeholder="Time (optional)" />
              <textarea style={{ ...inp, minHeight:'60px' }} placeholder="Reason *" value={visitForm.reason} onChange={e => setVisitForm(p=>({...p,reason:e.target.value}))} />
            </div>
            <button onClick={submitVisit} disabled={visitLoading} style={{ marginTop:'1rem', width:'100%', padding:'12px', background:'#16a34a', color:'white', border:'none', borderRadius:'12px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
              {visitLoading ? 'Saving...' : 'Schedule Visit'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
        <div>
          <h1 style={{ margin:0, fontSize:'1.35rem', fontWeight:800, color:'#0f172a' }}>Vet Task Feed</h1>
          <p style={{ margin:'3px 0 0', fontSize:'12px', color:'#64748b' }}>{feed.linkedFarmers} linked farmer{feed.linkedFarmers !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => loadFeed(true)} style={{ padding:'8px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'10px', cursor:'pointer', color:'#64748b' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {feedLoading && <div style={{ textAlign:'center', padding:'2rem', color:'#94a3b8', fontSize:'13px' }}>Loading feed...</div>}
      {feedError && <div style={{ padding:'12px 16px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'12px', fontSize:'13px', color:'#dc2626', marginBottom:'1rem' }}>⚠️ {feedError}</div>}

      {/* Urgent Cases */}
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
          <AlertTriangle size={16} color="#ef4444" />
          <h2 style={{ margin:0, fontSize:'13px', fontWeight:800, color:'#0f172a', textTransform:'uppercase', letterSpacing:'0.05em' }}>
            Urgent Cases
          </h2>
          {urgent.filter(a=>!a.resolved).length > 0 && (
            <span style={{ background:'#dc2626', color:'white', fontSize:'11px', fontWeight:800, padding:'2px 8px', borderRadius:'99px' }}>
              {urgent.filter(a=>!a.resolved).length}
            </span>
          )}
        </div>
        {urgent.length === 0 && !feedLoading ? (
          <div style={{ padding:'20px', textAlign:'center', background:'#f0fdf4', borderRadius:'12px', border:'1px solid #bbf7d0' }}>
            <p style={{ margin:0, fontSize:'13px', color:'#16a34a', fontWeight:700 }}>✓ No urgent cases right now</p>
          </div>
        ) : (
          urgent.filter(a=>!a.resolved).map(a => (
            <UrgentCard key={a._id} alert={a} onDiagnose={setDiagnoseAlert} onSchedule={openSchedule} />
          ))
        )}
      </div>

      {/* Today's Visits */}
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <Calendar size={16} color="#0284c7" />
            <h2 style={{ margin:0, fontSize:'13px', fontWeight:800, color:'#0f172a', textTransform:'uppercase', letterSpacing:'0.05em' }}>Today's Visits</h2>
          </div>
          <button onClick={() => navigate('visits')} style={{ fontSize:'11px', fontWeight:700, color:'#0284c7', background:'#e0f2fe', border:'none', borderRadius:'7px', padding:'4px 10px', cursor:'pointer' }}>See All</button>
        </div>
        {allVisits.length === 0 ? (
          <div style={{ padding:'16px', textAlign:'center', background:'#f8fafc', borderRadius:'12px', border:'1px solid #e2e8f0' }}>
            <p style={{ margin:'0 0 8px', fontSize:'13px', color:'#94a3b8' }}>No visits scheduled today</p>
            <button onClick={() => navigate('visits')} style={{ fontSize:'12px', fontWeight:700, color:'#0284c7', background:'none', border:'none', cursor:'pointer' }}>+ Schedule a visit →</button>
          </div>
        ) : (
          allVisits.map(v => <VisitCard key={v._id} visit={v} onComplete={completeVisit} onCancel={cancelVisit} />)
        )}
      </div>

      {/* Recent Treatments */}
      {feed.recentTreatments?.length > 0 && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <Stethoscope size={16} color="#7c3aed" />
              <h2 style={{ margin:0, fontSize:'13px', fontWeight:800, color:'#0f172a', textTransform:'uppercase', letterSpacing:'0.05em' }}>Recent Treatments</h2>
            </div>
            <button onClick={() => navigate('treatments')} style={{ fontSize:'11px', fontWeight:700, color:'#7c3aed', background:'#f3e8ff', border:'none', borderRadius:'7px', padding:'4px 10px', cursor:'pointer' }}>See All</button>
          </div>
          {feed.recentTreatments.map(t => (
            <div key={t._id} style={{ padding:'11px 13px', background:'white', border:'1px solid #e2e8f0', borderRadius:'12px', marginBottom:'7px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:700, color:'#0f172a' }}>🐄 {t.cowName}</p>
                  <p style={{ margin:0, fontSize:'11px', color:'#64748b' }}>{t.diagnosis}</p>
                  {t.farmerId && <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#94a3b8' }}>Farmer: {t.farmerId.name}</p>}
                </div>
                <span style={{ fontSize:'11px', color:'#94a3b8' }}>{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}
