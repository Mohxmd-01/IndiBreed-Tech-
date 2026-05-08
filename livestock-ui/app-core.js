'use strict';
/* ============================================================
   NiralFarm — Core: State, Auth, Navigation, Utils   v4.0
   ============================================================ */

const APP = {
  lang: 'en',
  currentCowId: null,
  currentCowTab: 'live',
  cattleFilter: 'all',
  alertFilter: 'all',
  sensorInterval: null,
  editingProfile: false
};

/* ── Init ── */
window.addEventListener('DOMContentLoaded', () => {
  DB.load();
  const d = DB.get();
  APP.lang = d.farmer.lang || 'en';
  applyLang(APP.lang);
  setupOfflineDetection();
  setupOtpBoxes();
  setupPhoneValidation();
  document.getElementById('milk-date') && (document.getElementById('milk-date').value = todayStr());
});

/* ── Language ── */
function applyLang(code) {
  APP.lang = code;
  const strings = I18N[code] || I18N.en;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (strings[key]) el.textContent = strings[key];
  });
}
function setLoginLang(code, btn) {
  document.querySelectorAll('.lang-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  applyLang(code);
}
function setAppLang(code, btn) {
  document.querySelectorAll('.lang-pill-sm').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  applyLang(code);
  DB.get().farmer.lang = code;
  DB.save();
}

/* ── Page navigation ── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ── Auth ── */
function showOtp() {
  const ph = document.getElementById('phone-input').value;
  if (ph.length < 10) { document.getElementById('phone-input').style.borderColor = '#e63946'; return; }
  document.getElementById('otp-phone-display').textContent = '+91 ' + ph;
  showPage('page-otp');
  startOtpTimer();
}
function verifyOtp() {
  const boxes = document.querySelectorAll('.otp-box');
  const code = Array.from(boxes).map(b => b.value).join('');
  if (code.length < 4) { showToast('Enter 4-digit OTP', 'error'); return; }
  showPage('page-app');
  showSection('dashboard');
  renderAll();
  showToast('Welcome to NiralFarm! 🐄', 'success');
}
function logout() {
  if (!confirm('Logout from NiralFarm?')) return;
  showPage('page-login');
  document.getElementById('phone-input').value = '';
  document.querySelectorAll('.otp-box').forEach(b => b.value = '');
}
function startOtpTimer() {
  let n = 30;
  const el = document.querySelector('.timer-txt');
  if (!el) return;
  el.textContent = '30s';
  const iv = setInterval(() => {
    n--;
    if (el) el.textContent = n > 0 ? n + 's' : 'Resend';
    if (n <= 0) clearInterval(iv);
  }, 1000);
}
function setupOtpBoxes() {
  document.querySelectorAll('.otp-box').forEach((box, i, boxes) => {
    box.addEventListener('input', function() {
      if (this.value.length === 1 && i < boxes.length - 1) boxes[i+1].focus();
    });
    box.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && !this.value && i > 0) boxes[i-1].focus();
    });
  });
}
function setupPhoneValidation() {
  const el = document.getElementById('phone-input');
  if (!el) return;
  el.addEventListener('input', function() {
    this.style.borderColor = '#ddd';
    this.value = this.value.replace(/\D/g, '').slice(0, 10);
  });
}

/* ── Section navigation ── */
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('section-' + name);
  if (sec) sec.classList.add('active');
  const nav = document.getElementById('nav-' + name);
  if (nav) nav.classList.add('active');
  const bnav = document.getElementById('bnav-' + name);
  if (bnav) bnav.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').style.display = 'none';

  // Render on-demand
  if (name === 'dashboard') renderDashboard();
  else if (name === 'cattle') renderCattleGrid();
  else if (name === 'devices') renderDevices();
  else if (name === 'milk') renderMilk();
  else if (name === 'alerts') renderAlerts();
  else if (name === 'health') renderHealth();
  else if (name === 'finance') renderFinance();
  else if (name === 'advisory') renderAdvisory();
  else if (name === 'profile') renderProfile();
}

function renderAll() {
  renderDashboard();
  updateAlertBadge();
  const d = DB.get();
  document.getElementById('sidebar-name').textContent = d.farmer.name;
  document.getElementById('sidebar-loc').textContent = d.farmer.village + ', ' + d.farmer.state;
  applyLang(APP.lang);
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebar-overlay');
  sb.classList.toggle('open');
  ov.style.display = sb.classList.contains('open') ? 'block' : 'none';
}

/* ── Modals ── */
function openModal(id) {
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById(id).classList.add('active');
  if (id === 'modal-add-device') populateCollarCowDropdowns();
  if (id === 'modal-record-milk') populateMilkCowDropdown();
  if (id === 'modal-add-vaccine') populateVacCowDropdown();
}
function closeAllModals() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}
function setToggle(activeId, inactiveId) {
  document.getElementById(activeId).classList.add('active');
  document.getElementById(inactiveId).classList.remove('active');
}
function setDeviceTab(tab) {
  if (tab === 'manual') {
    document.getElementById('device-manual-tab').style.display = 'block';
    document.getElementById('device-qr-tab').style.display = 'none';
    document.getElementById('dtab-manual').classList.add('active');
    document.getElementById('dtab-qr').classList.remove('active');
  } else {
    document.getElementById('device-manual-tab').style.display = 'none';
    document.getElementById('device-qr-tab').style.display = 'block';
    document.getElementById('dtab-manual').classList.remove('active');
    document.getElementById('dtab-qr').classList.add('active');
  }
}

/* ── Offline detection ── */
function setupOfflineDetection() {
  function update() {
    const pill = document.getElementById('offline-pill');
    if (pill) pill.style.display = navigator.onLine ? 'none' : 'block';
    if (!navigator.onLine) showToast('📴 You are offline. Data saved locally.', 'warning');
    else showToast('✅ Back online! Data synced.', 'success');
  }
  window.addEventListener('offline', update);
  window.addEventListener('online', update);
}

/* ── Toast ── */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3000);
}

/* ── Utilities ── */
function todayStr() { return new Date().toISOString().split('T')[0]; }
function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff/60000) + ' min ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + ' hr ago';
  return Math.floor(diff/86400000) + ' days ago';
}
function getBattColor(pct) { return pct >= 50 ? '#52b788' : pct >= 25 ? '#f9c74f' : '#e63946'; }
function healthIcon(s) { return s === 'healthy' ? '🟢' : s === 'warning' ? '🟡' : '🔴'; }
function healthLabel(s) { return s === 'healthy' ? 'Healthy' : s === 'warning' ? 'Warning' : 'Critical'; }
function lactLabel(n) {
  if (n === 0) return 'Dry';
  if (n === 1) return '1st Lac.';
  if (n === 2) return '2nd Lac.';
  if (n === 3) return '3rd Lac.';
  return n + 'th Lac.';
}
function updateAlertBadge() {
  const d = DB.get();
  const cnt = d.alerts.filter(a => !a.resolved).length;
  const badge = document.getElementById('alert-badge');
  if (badge) badge.textContent = cnt;
  const dot = document.getElementById('bell-dot');
  if (dot) dot.style.display = cnt > 0 ? 'inline-block' : 'none';
}
function greetingText() {
  const h = new Date().getHours();
  const s = I18N[APP.lang];
  if (h < 12) return s.goodMorning;
  if (h < 17) return s.goodAfternoon;
  return s.goodEvening;
}
function miniBar(val, max, color) {
  const pct = Math.min(100, Math.round((val / max) * 100));
  return `<div style="background:#f3f4f6;border-radius:6px;height:8px;width:100%;overflow:hidden"><div style="background:${color};height:100%;width:${pct}%;border-radius:6px;transition:.4s"></div></div>`;
}
function setCattleFilter(f, btn) {
  APP.cattleFilter = f;
  document.querySelectorAll('#section-cattle .filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderCattleGrid();
}
function setAlertFilter(f, btn) {
  APP.alertFilter = f;
  document.querySelectorAll('#section-alerts .filter-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderAlerts();
}
