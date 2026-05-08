import { useEffect } from 'react';
import { Stethoscope, Users, Calendar, ClipboardList } from 'lucide-react';
import { useVet } from '../../context/VetContext';

export default function VetProfile({ onLogout }) {
  const { profile, loadProfile, vetUser, navigate } = useVet();

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const user = profile?.user || vetUser || {};
  const stats = profile?.stats || { totalFarmers: 0, totalTreatments: 0, totalVisits: 0 };

  return (
    <div style={{ padding:'1.25rem 1.5rem', maxWidth:'500px', margin:'0 auto', fontFamily:"'Inter',sans-serif" }}>
      <h1 style={{ margin:'0 0 1.5rem', fontSize:'1.35rem', fontWeight:800, color:'#0f172a' }}>Profile</h1>

      {/* Avatar + info */}
      <div style={{ background:'linear-gradient(135deg,#1e3a8a,#1e40af)', borderRadius:'20px', padding:'1.5rem', marginBottom:'1.25rem', color:'white', display:'flex', alignItems:'center', gap:'16px' }}>
        <div style={{ width:'56px', height:'56px', background:'rgba(255,255,255,0.15)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', fontWeight:800, flexShrink:0 }}>
          {user.name?.[0] || '?'}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ margin:'0 0 3px', fontSize:'16px', fontWeight:800 }}>{user.name || 'Dr. Veterinarian'}</p>
          <p style={{ margin:'0 0 2px', fontSize:'12px', color:'rgba(255,255,255,0.7)' }}>{user.orgName || 'Animal Clinic'}</p>
          <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.6)' }}>📞 {user.phone}</p>
        </div>
        <div style={{ padding:'6px 12px', background:'rgba(255,255,255,0.15)', borderRadius:'99px', fontSize:'11px', fontWeight:700, border:'1px solid rgba(255,255,255,0.25)' }}>
          🩺 Vet
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'1.25rem' }}>
        {[
          { icon: <Users size={18} color="#16a34a" />, val: stats.totalFarmers, label:'Linked Farmers', action: () => navigate('link') },
          { icon: <ClipboardList size={18} color="#0284c7" />, val: stats.totalTreatments, label:'Treatments', action: () => navigate('treatments') },
          { icon: <Calendar size={18} color="#7c3aed" />, val: stats.totalVisits, label:'Visits Done', action: () => navigate('visits') },
        ].map((s, i) => (
          <button key={i} onClick={s.action} style={{ background:'white', border:'1.5px solid #e2e8f0', borderRadius:'14px', padding:'14px 12px', cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:'6px' }}>{s.icon}</div>
            <p style={{ margin:'0 0 2px', fontSize:'1.25rem', fontWeight:800, color:'#0f172a' }}>{s.val}</p>
            <p style={{ margin:0, fontSize:'10px', color:'#64748b', fontWeight:600 }}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ background:'white', border:'1.5px solid #e2e8f0', borderRadius:'16px', overflow:'hidden', marginBottom:'1.25rem' }}>
        {[
          { icon:'🌾', label:'My Farmers', sub:'View linked farmers & risk', action:'link' },
          { icon:'🩺', label:'Treatments', sub:'All diagnosis records', action:'treatments' },
          { icon:'📅', label:'Visits', sub:'Scheduled & completed', action:'visits' },
          { icon:'📥', label:'Task Feed', sub:'Urgent cases & alerts', action:'feed' },
        ].map((item, i, arr) => (
          <button key={item.action} onClick={() => navigate(item.action)} style={{ width:'100%', display:'flex', alignItems:'center', gap:'12px', padding:'13px 16px', background:'none', border:'none', borderBottom: i < arr.length-1 ? '1px solid #f1f5f9' : 'none', cursor:'pointer', textAlign:'left' }}>
            <span style={{ fontSize:'1.2rem', width:'24px', textAlign:'center' }}>{item.icon}</span>
            <div style={{ flex:1 }}>
              <p style={{ margin:'0 0 1px', fontSize:'13px', fontWeight:700, color:'#0f172a' }}>{item.label}</p>
              <p style={{ margin:0, fontSize:'11px', color:'#94a3b8' }}>{item.sub}</p>
            </div>
            <span style={{ color:'#cbd5e1', fontSize:'14px' }}>›</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button onClick={onLogout} style={{ width:'100%', padding:'13px', background:'#fef2f2', border:'1.5px solid #fca5a5', color:'#dc2626', borderRadius:'14px', fontSize:'13px', fontWeight:700, cursor:'pointer' }}>
        Logout from NiralFarm
      </button>

      <p style={{ margin:'1rem 0 0', textAlign:'center', fontSize:'11px', color:'#94a3b8' }}>NiralFarm v2 · Veterinarian Portal</p>
    </div>
  );
}
