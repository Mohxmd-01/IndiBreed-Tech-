import { useState } from 'react';
import { Edit2, Save, X, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { DB } from '../data';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
];

export default function Profile() {
  const { db, update } = useApp();
  const { t, i18n } = useTranslation();
  const f = db.farmer;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...f });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = () => {
    update(d => { d.farmer = { ...d.farmer, ...form }; return d; });
    setEditing(false);
  };

  const resetData = () => {
    if (!confirm('Reset all data to demo defaults?')) return;
    DB.reset();
    window.location.reload();
  };

  // Language switcher — instantly changes UI
  const switchLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('niralFarm_lang', code);
    set('lang', code);
    update(d => { d.farmer.lang = code; return d; });
  };

  const stats = [
    { l: t('totalCattleStat'),  v: db.cattle.length },
    { l: t('smartCollarsStat'), v: db.devices.length },
    { l: t('activeAlertsStat'), v: db.alerts.filter(a => !a.resolved).length },
    { l: t('daysTracked'),      v: 30 },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-2xl">
      {/* Hero */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-green-700">
              {f.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{f.name}</h2>
              <p className="text-sm text-gray-500">{f.farmName}</p>
              <p className="text-xs text-gray-400 mt-0.5">+91 {f.phone}</p>
            </div>
          </div>
          <button
            onClick={() => editing ? setEditing(false) : setEditing(true)}
            className={editing ? 'btn-secondary' : 'btn-primary'}
          >
            {editing ? <><X size={15} />{t('cancelEdit')}</> : <><Edit2 size={15} />{t('editProfile')}</>}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {stats.map(s => (
            <div key={s.l} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{s.v}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Farm Details */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">{t('farmInformation')}</h3>
        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { k: 'name',     l: t('fullName') },
              { k: 'farmName', l: t('farmName') },
              { k: 'village',  l: t('village') },
              { k: 'district', l: t('district') },
              { k: 'state',    l: t('state') },
              { k: 'farmSize', l: t('farmSize') },
            ].map(({ k, l }) => (
              <div key={k}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                <input className="input" value={form[k] || ''} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
            <div className="sm:col-span-2">
              <button onClick={save} className="btn-primary"><Save size={15} />{t('saveChanges')}</button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[
              { l: t('village'),     v: f.village },
              { l: t('district'),    v: f.district },
              { l: t('state'),       v: f.state },
              { l: t('farmSize'),    v: f.farmSize + ' acres' },
              { l: t('memberSince'), v: f.joinDate || '2024' },
            ].map(r => (
              <div key={r.l} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">{r.l}</span>
                <span className="text-sm font-semibold text-gray-900">{r.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('appSettings')}</h3>

        {/* Language switcher — WORKS INSTANTLY */}
        <div className="flex items-center justify-between py-3 border-b border-gray-50">
          <div>
            <p className="text-sm font-medium text-gray-700">{t('language')}</p>
            <p className="text-xs text-gray-400">{t('interfaceLanguage')}</p>
          </div>
          <div className="flex gap-1.5">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => switchLang(l.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  i18n.language === l.code
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reset Demo Data */}
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">{t('resetDemoData')}</p>
            <p className="text-xs text-gray-400">{t('restoreDefaults')}</p>
          </div>
          <button onClick={resetData} className="flex items-center gap-2 px-3.5 py-2 bg-red-50 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-100 transition-colors">
            <RotateCcw size={13} />{t('reset')}
          </button>
        </div>
      </div>
    </div>
  );
}
