/**
 * VetApp.jsx — Veterinarian portal shell.
 * Inbox-first design: VetFeed IS the main screen.
 */
import { useState } from 'react';
import { Stethoscope, Inbox, ClipboardList, Calendar, Link2, User, LogOut, Menu, X, AlertTriangle } from 'lucide-react';
import { VetProvider, useVet } from '../context/VetContext';
import VetFeed from '../pages/vet/VetFeed';
import VetTreatments from '../pages/vet/VetTreatments';
import VetVisits from '../pages/vet/VetVisits';
import VetLinkFarmer from '../pages/vet/VetLinkFarmer';
import VetProfile from '../pages/vet/VetProfile';

const NAV = [
  { key:'feed',       icon: Inbox,          label:'Task Feed',   badge:'urgent' },
  { key:'treatments', icon: ClipboardList,   label:'Treatments'  },
  { key:'visits',     icon: Calendar,        label:'Visits'      },
  { key:'link',       icon: Link2,           label:'My Farmers'  },
  { key:'profile',    icon: User,            label:'Profile'     },
];

function VetSidebar({ onLogout, onClose }) {
  const { section, navigate, urgentCount, vetUser } = useVet();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const doLogout = () => { localStorage.removeItem('niralFarm_auth'); onLogout?.(); };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'white' }}>
      {/* Brand */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', borderBottom:'1px solid #f1f5f9' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,#1e40af,#1d4ed8)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Stethoscope size={16} color="white" />
          </div>
          <div>
            <p style={{ margin:0, fontSize:'13px', fontWeight:800, color:'#0f172a' }}>NiralFarm</p>
            <p style={{ margin:0, fontSize:'10px', fontWeight:700, color:'#0284c7' }}>🩺 Vet Portal</p>
          </div>
        </div>
        {onClose && <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}><X size={18} /></button>}
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px', overflowY:'auto' }}>
        {NAV.map(({ key, icon: Icon, label, badge }) => {
          const active = section === key;
          const count  = badge === 'urgent' ? urgentCount : 0;
          return (
            <button key={key} onClick={() => { navigate(key); onClose?.(); }} style={{
              width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'11px', border:'none',
              background: active ? 'linear-gradient(135deg,#eff6ff,#dbeafe)' : 'transparent',
              color: active ? '#1e40af' : '#475569', cursor:'pointer', marginBottom:'2px',
              fontFamily:"'Inter',sans-serif", fontSize:'13px', fontWeight: active ? 700 : 500, transition:'all 0.15s',
            }}>
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ flex:1, textAlign:'left' }}>{label}</span>
              {count > 0 && (
                <span style={{ background:'#ef4444', color:'white', fontSize:'10px', fontWeight:800, padding:'1px 7px', borderRadius:'99px', animation:'pulse 2s ease-in-out infinite' }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding:'12px', borderTop:'1px solid #f1f5f9' }}>
        {vetUser && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', marginBottom:'8px' }}>
            <div style={{ width:'32px', height:'32px', background:'#eff6ff', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#1e40af', fontSize:'13px', flexShrink:0 }}>
              {vetUser.name?.[0] || '?'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:0, fontSize:'12px', fontWeight:700, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{vetUser.name}</p>
              <p style={{ margin:0, fontSize:'10px', color:'#94a3b8' }}>Veterinarian</p>
            </div>
          </div>
        )}
        {confirmLogout ? (
          <div style={{ padding:'10px 12px', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:'11px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
              <AlertTriangle size={12} color="#dc2626" />
              <p style={{ margin:0, fontSize:'11px', fontWeight:700, color:'#dc2626' }}>Logout from NiralFarm?</p>
            </div>
            <div style={{ display:'flex', gap:'6px' }}>
              <button onClick={doLogout} style={{ flex:1, padding:'6px', background:'#dc2626', color:'white', border:'none', borderRadius:'8px', fontSize:'11px', fontWeight:700, cursor:'pointer' }}>Yes</button>
              <button onClick={() => setConfirmLogout(false)} style={{ flex:1, padding:'6px', background:'white', border:'1px solid #e2e8f0', color:'#64748b', borderRadius:'8px', fontSize:'11px', fontWeight:600, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirmLogout(true)} style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'11px', border:'none', background:'transparent', color:'#ef4444', cursor:'pointer', fontSize:'13px', fontWeight:600 }}>
            <LogOut size={16} strokeWidth={1.8} /> Logout
          </button>
        )}
      </div>
    </div>
  );
}

function VetShell({ onLogout }) {
  const { section, navigate, sidebarOpen, setSidebarOpen } = useVet();

  const PAGE = {
    feed:       <VetFeed />,
    treatments: <VetTreatments />,
    visits:     <VetVisits />,
    link:       <VetLinkFarmer />,
    profile:    <VetProfile onLogout={onLogout} />,
  };

  return (
    <div style={{ display:'flex', height:'100vh', fontFamily:"'Inter',sans-serif", background:'#f8fafc', overflow:'hidden' }}>
      {/* Desktop sidebar */}
      <aside style={{ display:'none', width:'220px', background:'white', borderRight:'1px solid #f1f5f9', height:'100vh', flexShrink:0, flexDirection:'column' }} className="vet-sidebar-desktop">
        <VetSidebar onLogout={onLogout} />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:50 }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(4px)' }} onClick={() => setSidebarOpen(false)} />
          <aside style={{ position:'absolute', left:0, top:0, bottom:0, width:'220px', background:'white', boxShadow:'0 0 40px rgba(0,0,0,0.15)' }}>
            <VetSidebar onLogout={onLogout} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
        {/* Mobile topbar */}
        <div className="vet-topbar-mobile" style={{ display:'none', alignItems:'center', gap:'12px', padding:'12px 16px', background:'white', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#374151' }}><Menu size={20} /></button>
          <p style={{ margin:0, fontSize:'14px', fontWeight:800, color:'#0f172a' }}>
            {NAV.find(n=>n.key===section)?.label || 'Task Feed'}
          </p>
        </div>

        <main style={{ flex:1, overflowY:'auto' }}>
          {PAGE[section] || <VetFeed />}
        </main>

        {/* Mobile bottom nav */}
        <div className="vet-bottom-nav" style={{ display:'none', background:'white', borderTop:'1px solid #f1f5f9', padding:'8px 0 env(safe-area-inset-bottom)', flexShrink:0 }}>
          {NAV.filter(n=>n.key!=='profile').map(({ key, icon: Icon, label }) => {
            const active = section === key;
            return (
              <button key={key} onClick={() => navigate(key)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'6px 2px', background:'none', border:'none', cursor:'pointer', color: active ? '#1e40af' : '#94a3b8' }}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span style={{ fontSize:'9px', fontWeight: active ? 700 : 500 }}>{label}</span>
              </button>
            );
          })}
          <button onClick={() => navigate('profile')} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'6px 2px', background:'none', border:'none', cursor:'pointer', color: section==='profile' ? '#1e40af' : '#94a3b8' }}>
            <User size={18} strokeWidth={section==='profile' ? 2.2 : 1.8} />
            <span style={{ fontSize:'9px', fontWeight: section==='profile' ? 700 : 500 }}>Profile</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @media(min-width:768px){
          .vet-sidebar-desktop{ display:flex!important; }
          .vet-topbar-mobile{ display:none!important; }
          .vet-bottom-nav{ display:none!important; }
        }
        @media(max-width:767px){
          .vet-sidebar-desktop{ display:none!important; }
          .vet-topbar-mobile{ display:flex!important; }
          .vet-bottom-nav{ display:flex!important; }
        }
      `}</style>
    </div>
  );
}

export default function VetApp({ vetUser, onLogout }) {
  return (
    <VetProvider vetUser={vetUser}>
      <VetShell onLogout={onLogout} />
    </VetProvider>
  );
}
