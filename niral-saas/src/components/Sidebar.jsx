import { useState } from 'react';
import {
  LayoutDashboard, Beef, Radio, Milk, Bell, HeartPulse,
  DollarSign, Sparkles, User, LogOut, Wifi, X, AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import indibreedLogo from '../assets/indibreed-logo.svg';

const NAV_KEYS = [
  { key: 'dashboard', icon: LayoutDashboard, tKey: 'dashboard' },
  { key: 'cattle',    icon: Beef,            tKey: 'cattle' },
  { key: 'devices',   icon: Radio,           tKey: 'smartCollars' },
  { key: 'milk',      icon: Milk,            tKey: 'milkTracking' },
  { key: 'alerts',    icon: Bell,            tKey: 'alerts' },
  { key: 'health',    icon: HeartPulse,      tKey: 'health' },
  { key: 'finance',   icon: DollarSign,      tKey: 'finance' },
  { key: 'advisory',  icon: Sparkles,        tKey: 'advisory' },
  { key: 'profile',   icon: User,            tKey: 'profile' },
];

function SidebarContent({ onClose, onLogout }) {
  const { t } = useTranslation();
  const { db, section, navigate, activeAlerts } = useApp();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const doLogout = () => {
    localStorage.removeItem('niralFarm_auth'); // key kept for compatibility
    onLogout?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src={indibreedLogo} alt="IndiBreed Tech" className="w-10 h-10 object-contain" />
          <div className="leading-tight">
            <span className="font-bold text-gray-900 text-sm block">IndiBreed Tech</span>
            <span className="text-[10px] text-teal-600 font-medium">Data-Driven Livestock</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_KEYS.map(({ key, icon: Icon, tKey }) => (
          <button
            key={key}
            onClick={() => { navigate(key); onClose?.(); }}
            className={`nav-item w-full ${section === key || (section === 'cow-detail' && key === 'cattle') ? 'active' : ''}`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{t(tKey)}</span>
            {key === 'alerts' && activeAlerts.length > 0 && (
              <span className="ml-auto text-xs font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                {activeAlerts.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-2">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
            {db.farmer.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{db.farmer.name}</p>
            {/* Onboarding progress indicator */}
            {(db.farmer.onboardingStep ?? 0) < 3 ? (
              <p className="text-xs text-amber-600 font-semibold truncate">
                ⚡ Setup: {Math.min((db.cattle?.length > 0 ? 1 : 0) + (db.milkLog?.length > 0 ? 1 : 0) + (db.devices?.length > 0 ? 1 : 0), 3)}/3 steps done
              </p>
            ) : (
              <p className="text-xs text-gray-500 truncate">
                <span className="inline-block bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-1">Free</span>
                {db.farmer.village || 'Maharashtra'}
              </p>
            )}
          </div>
          <Wifi size={13} strokeWidth={2} className="text-green-600 shrink-0" />
        </div>


        {/* Inline logout confirm */}
        {confirmLogout ? (
          <div className="mx-1 p-3 bg-red-50 border border-red-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2.5">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs font-semibold text-red-700">Logout from IndiBreed Tech?</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={doLogout}
                className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Yes, Logout
              </button>
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmLogout(true)}
            className="nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} strokeWidth={1.8} />
            <span>{t('logout')}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Sidebar({ onLogout }) {
  const { sidebarOpen, setSidebarOpen } = useApp();
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-100 h-screen sticky top-0 shrink-0">
        <SidebarContent onLogout={onLogout} />
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-white z-50 shadow-xl">
            <SidebarContent onClose={() => setSidebarOpen(false)} onLogout={onLogout} />
          </aside>
        </div>
      )}
    </>
  );
}
