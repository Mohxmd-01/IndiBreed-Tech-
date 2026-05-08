import { useState, useCallback, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Chatbot from './components/Chatbot';
import OfflineBanner from './components/OfflineBanner';
import ToastContainer from './components/ToastContainer';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Cattle from './pages/Cattle';
import CowDetail from './pages/CowDetail';
import Devices from './pages/Devices';
import Milk from './pages/Milk';
import Alerts from './pages/Alerts';
import Health from './pages/Health';
import Finance from './pages/Finance';
import Advisory from './pages/Advisory';
import Profile from './pages/Profile';
import VetApp from './components/VetApp';

function getStoredAuth() {
  try {
    const a = localStorage.getItem('niralFarm_auth');
    if (a) { const p = JSON.parse(a); if (p?.loggedIn) return p; }
  } catch { /* ignore */ }
  return null;
}

// ── Coming Soon placeholder for Phase 2 / 3 portals ──────────────────────────
function ComingSoonPortal({ roleName, emoji, onLogout }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', fontFamily:"'Inter',sans-serif", gap:'24px', padding:'2rem' }}>
      <div style={{ fontSize:'4rem' }}>{emoji}</div>
      <div style={{ textAlign:'center' }}>
        <h2 style={{ margin:'0 0 8px', fontSize:'1.75rem', fontWeight:800, color:'#14532d' }}>{roleName} Portal</h2>
        <p style={{ margin:0, color:'#6b7280', fontSize:'1rem', maxWidth:'340px' }}>
          This portal is coming in <strong>Phase 2</strong>. The farmer portal is fully live right now.
        </p>
      </div>
      <div style={{ padding:'16px 24px', background:'#fff', borderRadius:'16px', border:'1px solid #d1fae5', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', textAlign:'center', maxWidth:'320px' }}>
        <p style={{ margin:'0 0 4px', fontSize:'13px', color:'#374151', fontWeight:600 }}>Try the Farmer demo while you wait:</p>
        <p style={{ margin:0, fontSize:'12px', color:'#6b7280' }}>Phone: <strong>9876543210</strong> / Pass: <strong>demo123</strong></p>
      </div>
      <button onClick={onLogout} style={{ padding:'10px 24px', background:'#ef4444', color:'white', border:'none', borderRadius:'10px', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
        Logout & Switch Account
      </button>
    </div>
  );
}

// ── Farmer App Shell (existing) ───────────────────────────────────────────────
function FarmerApp({ onLogout }) {
  const { section } = useApp();

  const PAGE = {
    dashboard:    <Dashboard />,
    cattle:       <Cattle />,
    'cow-detail': <CowDetail />,
    devices:      <Devices />,
    milk:         <Milk />,
    alerts:       <Alerts />,
    health:       <Health />,
    finance:      <Finance />,
    advisory:     <Advisory />,
    profile:      <Profile onLogout={onLogout} />,
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <OfflineBanner />
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {PAGE[section] || <Dashboard />}
        </main>
      </div>
      <Chatbot />
    </div>
  );
}

// ── Root App — Role Router ────────────────────────────────────────────────────
export default function App() {
  const [auth, setAuth] = useState(() => getStoredAuth());

  const handleAuth = useCallback((user) => {
    setAuth({ ...user, loggedIn: true });
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('niralFarm_auth');
    localStorage.removeItem('niralFarm_token');
    setTimeout(() => setAuth(null), 0);
  }, []);

  useEffect(() => {
    window.logoutApp = handleLogout;
    return () => { delete window.logoutApp; };
  }, [handleLogout]);

  if (!auth) return <AuthPage onAuth={handleAuth} />;

  const role = auth.role || 'farmer';

  // Phase 2 — Vet Portal (fully live)
  if (role === 'veterinarian') {
    return <VetApp vetUser={auth} onLogout={handleLogout} />;
  }
  if (role === 'company') {
    return <ComingSoonPortal roleName="Dairy Company" emoji="🏭" onLogout={handleLogout} />;
  }

  // Default: Farmer App
  return (
    <AppProvider>
      <ToastContainer />
      <FarmerApp onLogout={handleLogout} />
    </AppProvider>
  );
}
