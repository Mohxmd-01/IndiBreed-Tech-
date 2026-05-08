// --- Page navigation ---
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showOtp() {
  const phone = document.getElementById('phone-input').value;
  if (phone.length < 10) {
    document.getElementById('phone-input').style.borderColor = '#e63946';
    return;
  }
  showPage('page-otp');
  startOtpTimer();
}

function showDashboard() {
  showPage('page-app');
  showSection('dashboard');
}

// --- Section navigation (within app) ---
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('section-' + name).classList.add('active');
  const navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');
  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
}

// --- Sidebar toggle (mobile) ---
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// --- Language pills ---
document.querySelectorAll('.lang-pill').forEach(pill => {
  pill.addEventListener('click', function () {
    document.querySelectorAll('.lang-pill').forEach(p => p.classList.remove('active'));
    this.classList.add('active');
  });
});

// --- OTP auto-advance ---
document.querySelectorAll('.otp-box').forEach((box, i, boxes) => {
  box.addEventListener('input', function () {
    if (this.value.length === 1 && i < boxes.length - 1) boxes[i + 1].focus();
  });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'Backspace' && !this.value && i > 0) boxes[i - 1].focus();
  });
});

// --- OTP timer ---
function startOtpTimer() {
  let countdown = 30;
  const el = document.querySelector('.timer-txt');
  if (!el) return;
  el.textContent = '30s';
  const iv = setInterval(() => {
    countdown--;
    if (el) el.textContent = countdown > 0 ? countdown + 's' : 'Resend';
    if (countdown <= 0) clearInterval(iv);
  }, 1000);
}

// --- Milk yield stepper ---
let yieldVal = 12;
function changeYield(delta) {
  yieldVal = Math.max(0, yieldVal + delta);
  const el = document.getElementById('yield-val');
  if (el) el.textContent = yieldVal;
}

// --- Session toggle ---
function setSession(btn) {
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// --- Phone input validation ---
const phoneInput = document.getElementById('phone-input');
if (phoneInput) {
  phoneInput.addEventListener('input', function () {
    this.style.borderColor = '#ddd';
    this.value = this.value.replace(/\D/g, '').slice(0, 10);
  });
}
