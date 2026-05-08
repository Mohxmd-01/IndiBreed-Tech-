import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Eye, EyeOff, Globe, ArrowRight, Loader, CheckCircle,
  Phone, Lock, User, Sparkles, ShieldCheck, Activity, Zap
} from 'lucide-react';
import { authAPI } from '../services/api';
import indibreedLogo from '../assets/indibreed-logo.svg';
import './Auth.css';

/* ── Constants ─────────────────────────────────────────────────── */
const LANGS = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'hi', label: 'हि', full: 'हिंदी' },
  { code: 'mr', label: 'म',  full: 'मराठी'  },
];

const ROLES = [
  { key: 'farmer',       icon: '🌾', label: 'Farmer',       sub: 'Track cattle & milk yields'         },
  { key: 'veterinarian', icon: '🩺', label: 'Veterinarian', sub: 'Manage patients & visits'           },
  { key: 'company',      icon: '🏭', label: 'Dairy Company', sub: 'Monitor the full supply chain'     },
];

const DEMO_ACCOUNTS = [
  { role: 'farmer',       icon: '🌾', phone: '9876543210', pass: 'demo123', name: 'Ramesh Patil'        },
  { role: 'veterinarian', icon: '🩺', phone: '9876543211', pass: 'demo123', name: 'Dr. Anjali Sharma'   },
  { role: 'company',      icon: '🏭', phone: '9876543212', pass: 'demo123', name: 'Sahyadri Dairy Co-op'},
];

const FEATURES = [
  { Icon: Activity, text: 'Real-time cattle health monitoring' },
  { Icon: Zap,      text: 'Instant fever & anomaly alerts'     },
  { Icon: ShieldCheck, text: 'End-to-end supply chain trust'   },
];

/* ── Component ──────────────────────────────────────────────────── */
export default function AuthPage({ onAuth }) {
  const { i18n } = useTranslation();
  const [mode,     setMode]     = useState('login');
  const [step,     setStep]     = useState(1);
  const [role,     setRole]     = useState('farmer');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [error,    setError]    = useState('');
  const [animIn,   setAnimIn]   = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', password:'', confirm:'', orgName:'' });

  useEffect(() => { const t = setTimeout(() => setAnimIn(true), 60); return () => clearTimeout(t); }, []);

  const set       = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };
  const currentLang = LANGS.find(l => l.code === i18n.language) || LANGS[0];
  const switchLang  = code => { i18n.changeLanguage(code); localStorage.setItem('niralFarm_lang', code); setLangOpen(false); };
  const switchMode  = m => {
    setAnimIn(false);
    setTimeout(() => { setMode(m); setStep(1); setError(''); setAnimIn(true); }, 200);
  };

  const persist = (user, token) => {
    // Always clear previous session before persisting a new one.
    // This prevents stale credentials from a previous user leaking into a new session.
    localStorage.removeItem('niralFarm_token');
    localStorage.removeItem('niralFarm_auth');
    if (token) localStorage.setItem('niralFarm_token', token);
    localStorage.setItem('niralFarm_auth', JSON.stringify({
      name: user.name,
      phone: user.phone,
      role: user.role || role,
      loggedIn: true,
    }));
  };

  const handleLogin = async () => {
    if (!form.phone || !form.password) return setError('Enter your phone number and password.');
    // Clear any stale session before attempting login
    localStorage.removeItem('niralFarm_token');
    localStorage.removeItem('niralFarm_auth');
    setLoading(true);
    try {
      const res = await authAPI.login({ phone: form.phone, password: form.password });
      const { token, user } = res.data;
      persist(user, token);
      setSuccess(true);
      setTimeout(() => onAuth({ name: user.name, phone: user.phone, role: user.role }), 700);
    } catch (err) {
      if (!err.response) {
        const demo = DEMO_ACCOUNTS.find(d => d.phone === form.phone && d.pass === form.password);
        if (demo) {
          persist({ name: demo.name, phone: demo.phone, role: demo.role }, null);
          setSuccess(true);
          setTimeout(() => onAuth({ name: demo.name, phone: demo.phone, role: demo.role }), 700);
          return;
        }
        setError('Backend offline. Try demo: 9876543210 / demo123');
      } else {
        setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
      }
    } finally { setLoading(false); }
  };

  const handleSignup = async () => {
    if (!form.name || !form.phone || !form.password) return setError('Please fill in all required fields.');
    if (form.phone.length < 10) return setError('Enter a valid 10-digit phone number.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    // Clear any stale session before registering a new account
    localStorage.removeItem('niralFarm_token');
    localStorage.removeItem('niralFarm_auth');
    setLoading(true);
    try {
      const payload = { name: form.name, phone: form.phone, password: form.password, role };
      if (role === 'farmer') payload.farmName = form.name + "'s Farm";
      else payload.orgName = form.orgName;
      const res = await authAPI.register(payload);
      const { token, user } = res.data;
      persist(user, token);
      setSuccess(true);
      setTimeout(() => onAuth({ name: user.name, phone: user.phone, role: user.role }), 700);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const loadDemo = async demo => {
    try {
      const res = await authAPI.login({ phone: demo.phone, password: demo.pass });
      const { token, user } = res.data;
      persist(user, token);
      onAuth({ name: user.name, phone: user.phone, role: user.role });
    } catch {
      persist({ name: demo.name, phone: demo.phone, role: demo.role }, null);
      onAuth({ name: demo.name, phone: demo.phone, role: demo.role });
    }
  };

  return (
    <div className="auth-root">

      {/* ── LEFT PANEL ───────────────────────────────────────── */}
      <aside className="auth-hero">
        {/* Decorative blobs */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />

        <div className="hero-inner">
          {/* Brand */}
          <div className="hero-brand">
            <img src={indibreedLogo} alt="IndiBreed Tech" style={{ width: 96, height: 96, objectFit: 'contain' }} />
            <span className="brand-name">IndiBreed Tech</span>
            <span className="brand-badge">v2</span>
          </div>

          {/* Headline */}
          <div className="hero-headline">
            <div className="hero-pill">
              <Sparkles size={12} color="#86efac" />
              <span>AI-Powered Livestock Management</span>
            </div>
            <h1 className="hero-title">
              Smart farming<br />
              <span className="hero-accent">starts here.</span>
            </h1>
            <p className="hero-sub">
              Real-time health alerts, milk yield tracking, and seamless vet coordination — all in one platform.
            </p>
          </div>

          {/* Feature list */}
          <ul className="hero-features">
            {FEATURES.map(({ Icon, text }) => (
              <li key={text} className="hero-feature-item">
                <div className="feature-icon-wrap"><Icon size={15} color="#86efac" /></div>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          {/* Stats */}
          <div className="hero-stats">
            {[{ v: '12K+', l: 'Farmers' }, { v: '85K+', l: 'Cattle' }, { v: '98%', l: 'Uptime' }].map(s => (
              <div key={s.l} className="stat-item">
                <span className="stat-value">{s.v}</span>
                <span className="stat-label">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANEL ──────────────────────────────────────── */}
      <main className="auth-form-panel">

        {/* Top bar */}
        <div className="auth-topbar">
          <div className="topbar-logo">
            <img src={indibreedLogo} alt="IndiBreed Tech" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            <span className="topbar-logo-text">IndiBreed Tech</span>
          </div>

          {/* Language switcher */}
          <div className="lang-wrap">
            <button className="lang-btn" onClick={() => setLangOpen(o => !o)}>
              <Globe size={13} strokeWidth={2} />
              <span>{currentLang.label}</span>
            </button>
            {langOpen && (
              <div className="lang-dropdown">
                {LANGS.map(l => (
                  <button
                    key={l.code}
                    className={`lang-option${i18n.language === l.code ? ' active' : ''}`}
                    onClick={() => switchLang(l.code)}
                  >
                    {l.full}
                    {i18n.language === l.code && <span className="lang-dot" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form container */}
        <div className="auth-center">
          <div className={`auth-card${animIn ? ' visible' : ''}`}>

            {/* Mode tabs */}
            <div className="mode-tabs">
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  className={`mode-tab${mode === m ? ' active' : ''}`}
                  onClick={() => switchMode(m)}
                >
                  {m === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            {/* Alerts */}
            {error   && <div className="alert alert-error">⚠ {error}</div>}
            {success && (
              <div className="alert alert-success">
                <CheckCircle size={14} /> All set! Redirecting…
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {mode === 'login' && (
              <>
                <div className="form-header">
                  <h2 className="form-title">Welcome back</h2>
                  <p className="form-sub">Sign in to your IndiBreed Tech account</p>
                </div>

                <div className="input-group">
                  <div className="input-wrap">
                    <Phone size={15} className="input-icon" />
                    <input
                      className="auth-input"
                      type="tel"
                      maxLength={10}
                      placeholder="Mobile number"
                      value={form.phone}
                      onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                  <div className="input-wrap">
                    <Lock size={15} className="input-icon" />
                    <input
                      className="auth-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Password"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    />
                    <button className="eye-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  className={`submit-btn${loading || success ? ' disabled' : ''}`}
                  onClick={handleLogin}
                  disabled={loading || success}
                >
                  {loading
                    ? <><Loader size={15} className="spin" /> Signing in…</>
                    : success
                    ? <><CheckCircle size={15} /> Done!</>
                    : <>Sign In <ArrowRight size={15} /></>}
                </button>
              </>
            )}

            {/* ── SIGNUP FORM ── */}
            {mode === 'signup' && (
              <>
                {step === 1 ? (
                  <>
                    <div className="form-header">
                      <h2 className="form-title">Choose your role</h2>
                      <p className="form-sub">Select the option that best describes you</p>
                    </div>

                    <div className="role-list">
                      {ROLES.map(r => (
                        <button
                          key={r.key}
                          className={`role-card${role === r.key ? ' selected' : ''}`}
                          onClick={() => setRole(r.key)}
                        >
                          <span className="role-icon">{r.icon}</span>
                          <div className="role-text">
                            <p className="role-label">{r.label}</p>
                            <p className="role-sub">{r.sub}</p>
                          </div>
                          {role === r.key && (
                            <div className="role-check"><CheckCircle size={13} color="#fff" /></div>
                          )}
                        </button>
                      ))}
                    </div>

                    <button className="submit-btn" onClick={() => setStep(2)}>
                      Continue as {ROLES.find(r => r.key === role)?.label} <ArrowRight size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="form-header">
                      <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
                      <h2 className="form-title">
                        {ROLES.find(r => r.key === role)?.icon} Create account
                      </h2>
                      <p className="form-sub">A few details to get you started</p>
                    </div>

                    <div className="input-group">
                      <div className="input-wrap">
                        <User size={15} className="input-icon" />
                        <input className="auth-input" placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} />
                      </div>
                      {role !== 'farmer' && (
                        <div className="input-wrap">
                          <span className="input-icon-emoji">
                            {role === 'veterinarian' ? '🏥' : '🏭'}
                          </span>
                          <input
                            className="auth-input"
                            placeholder={role === 'veterinarian' ? 'Clinic name' : 'Company name'}
                            value={form.orgName}
                            onChange={e => set('orgName', e.target.value)}
                          />
                        </div>
                      )}
                      <div className="input-wrap">
                        <Phone size={15} className="input-icon" />
                        <input className="auth-input" type="tel" maxLength={10} placeholder="Mobile number" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} />
                      </div>
                      <div className="input-wrap">
                        <Lock size={15} className="input-icon" />
                        <input className="auth-input" type={showPass ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={e => set('password', e.target.value)} />
                        <button className="eye-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <div className="input-wrap">
                        <Lock size={15} className="input-icon" />
                        <input className="auth-input" type="password" placeholder="Confirm password" value={form.confirm} onChange={e => set('confirm', e.target.value)} />
                      </div>
                    </div>

                    <button
                      className={`submit-btn${loading || success ? ' disabled' : ''}`}
                      onClick={handleSignup}
                      disabled={loading || success}
                    >
                      {loading
                        ? <><Loader size={15} className="spin" /> Creating…</>
                        : success
                        ? <><CheckCircle size={15} /> Done!</>
                        : <>Create Account <ArrowRight size={15} /></>}
                    </button>
                  </>
                )}
              </>
            )}

            {/* Demo accounts */}
            <div className="demo-box">
              <p className="demo-title">🎯 Quick Demo Access</p>
              <div className="demo-list">
                {DEMO_ACCOUNTS.map(d => (
                  <div key={d.role} className="demo-row">
                    <span className="demo-name">{d.icon} {d.name}</span>
                    <button className="demo-btn" onClick={() => loadDemo(d)}>Try →</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Switch mode link */}
            <p className="switch-line">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button className="switch-btn" onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
