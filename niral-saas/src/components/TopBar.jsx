import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Bell, Menu, Plus, Globe, X, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { timeAgo } from '../data';
import SyncStatus from './SyncStatus';

const SECTION_TITLE_KEYS = {
  dashboard:'farmDashboard', cattle:'cattleManagement', devices:'smartCollars',
  milk:'milkTracking', alerts:'alertsNotifications', health:'healthStatus',
  finance:'financialTracking', advisory:'smartAdvisory', profile:'profile',
  'cow-detail':'cattleDetails',
};

const LANGS = [
  { code:'en', label:'EN', full:'English' },
  { code:'hi', label:'हि', full:'हिंदी' },
  { code:'mr', label:'म', full:'मराठी' },
];

function useDebounce(val, delay) {
  const [debounced, setDebounced] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(val), delay);
    return () => clearTimeout(t);
  }, [val, delay]);
  return debounced;
}

export default function TopBar() {
  const { t, i18n } = useTranslation();
  const { section, db, searchQuery, setSearchQuery, notifOpen, setNotifOpen,
          activeAlerts, setSidebarOpen, navigate } = useApp();

  const [langOpen, setLangOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);
  const debouncedQ = useDebounce(searchQuery, 300);
  const searchRef = useRef(null);
  const langRef = useRef(null);

  // Smart search results
  const results = useCallback(() => {
    if (!debouncedQ || debouncedQ.length < 2) return null;
    const q = debouncedQ.toLowerCase();
    const cattle = db.cattle.filter(c =>
      c.name.toLowerCase().includes(q) || c.tagId.toLowerCase().includes(q) || c.breed.toLowerCase().includes(q)
    ).slice(0, 4);
    const alerts = db.alerts.filter(a =>
      !a.resolved && (a.title.toLowerCase().includes(q) || a.cowName.toLowerCase().includes(q))
    ).slice(0, 3);
    const devices = db.devices.filter(d =>
      d.collarId.toLowerCase().includes(q)
    ).slice(0, 3);
    return { cattle, alerts, devices };
  }, [debouncedQ, db]);

  const res = results();
  const hasResults = res && (res.cattle.length || res.alerts.length || res.devices.length);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!searchRef.current?.contains(e.target)) setSearchFocus(false);
      if (!langRef.current?.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('niralFarm_lang', code);
    setLangOpen(false);
  };

  const currentLang = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 h-16 flex items-center gap-4 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500">
        <Menu size={20} />
      </button>

      {/* Title */}
      <h1 className="text-base font-semibold text-gray-900 hidden sm:block shrink-0">
        {t(SECTION_TITLE_KEYS[section] || 'dashboard')}
      </h1>

      {/* Smart Search */}
      <div className="flex-1 max-w-md mx-auto lg:mx-0 lg:ml-6 relative" ref={searchRef}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchFocus && debouncedQ.length >= 2 && (
          <div className="absolute top-11 left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {!hasResults ? (
              <p className="px-4 py-4 text-sm text-gray-400">{t('noResults')}</p>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {res.cattle.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('searchCattle')}</p>
                    {res.cattle.map(c => (
                      <button key={c.id} onClick={() => { navigate('cow-detail', c.id); setSearchFocus(false); setSearchQuery(''); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors">
                        <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center text-xs font-bold text-green-700 shrink-0">{c.name[0]}</div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400">{c.tagId} · {c.breed}</p>
                        </div>
                        <span className={`badge ${c.health==='healthy'?'badge-green':c.health==='warning'?'badge-yellow':'badge-red'}`}>{t(c.health)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {res.alerts.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('searchAlerts')}</p>
                    {res.alerts.map(a => (
                      <button key={a.id} onClick={() => { navigate('alerts'); setSearchFocus(false); setSearchQuery(''); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${a.type==='critical'?'bg-red-500':'bg-yellow-500'}`}/>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">{a.cowName} — {a.title}</p>
                          <p className="text-xs text-gray-400">{timeAgo(a.time)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {res.devices.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('searchDevices')}</p>
                    {res.devices.map(d => {
                      const cow = db.cattle.find(c => c.id === d.linkedCowId);
                      return (
                        <button key={d.id} onClick={() => { navigate('devices'); setSearchFocus(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors">
                          <div className="text-left">
                            <p className="text-sm font-semibold text-gray-900">{d.collarId}</p>
                            <p className="text-xs text-gray-400">{cow?.name || '—'} · {d.battery}%</p>
                          </div>
                          <span className={`badge ml-auto ${d.status==='online'?'badge-green':'badge-gray'}`}>{t(d.status)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Sync Status */}
        <SyncStatus />
        {/* Language Switcher */}
        <div className="relative" ref={langRef}>
          <button onClick={() => setLangOpen(o => !o)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl hover:bg-gray-100 text-gray-600 text-xs font-bold transition-colors">
            <Globe size={15} className="text-gray-400"/>
            {currentLang.label}
          </button>
          {langOpen && (
            <div className="absolute right-0 top-11 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden w-36">
              {LANGS.map(l => (
                <button key={l.code} onClick={() => switchLang(l.code)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${i18n.language===l.code?'font-bold text-green-600':' text-gray-700'}`}>
                  <span>{l.full}</span>
                  {i18n.language===l.code && <span className="w-1.5 h-1.5 bg-green-500 rounded-full"/>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <Bell size={19} />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">{t('notifications')}</span>
                <span className="badge badge-red">{activeAlerts.length} new</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {activeAlerts.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-400 text-center">{t('noAlerts')}</p>
                ) : activeAlerts.slice(0, 6).map(a => (
                  <button key={a.id} onClick={() => { navigate('alerts'); setNotifOpen(false); }}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 text-left">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${a.type==='critical'?'bg-red-500':a.type==='warning'?'bg-yellow-500':'bg-blue-500'}`} />
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{a.cowName} — {a.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{timeAgo(a.time)}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-gray-100">
                <button onClick={() => { navigate('alerts'); setNotifOpen(false); }}
                  className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1">
                  {t('viewAllAlerts')} <ArrowRight size={11}/>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add button */}
        <button onClick={() => navigate('cattle')} className="btn-primary hidden sm:flex">
          <Plus size={16} />{t('addCattle')}
        </button>
      </div>
    </header>
  );
}
