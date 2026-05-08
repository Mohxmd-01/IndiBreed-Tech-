'use strict';
/* NiralFarm — Finance, Advisory, Profile v4.0 */

function renderFinance() {
  const d = DB.get();
  const fin = d.finance;
  const today = todayStr();
  const weekStart = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
  const monthStart = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0];

  const todayL = d.milkLog.filter(m => m.date === today).reduce((s, m) => s + m.total, 0);
  const weekL = d.milkLog.filter(m => m.date >= weekStart).reduce((s, m) => s + m.total, 0);
  const monthL = d.milkLog.filter(m => m.date >= monthStart).reduce((s, m) => s + m.total, 0);
  const activeCows = d.cattle.filter(c => c.lactation > 0).length;

  const todayRev = todayL * fin.pricePerLitre;
  const monthRev = monthL * fin.pricePerLitre;
  const monthCost = (fin.feedCostPerCowPerDay * activeCows + fin.otherCostPerDay) * 30;
  const monthProfit = monthRev - monthCost;

  document.getElementById('finance-stats').innerHTML = `
    <div class="stat-card"><div class="stat-icon green">💰</div><div><div class="stat-val">${fmt(todayRev)}</div><div class="stat-lbl">Today's Revenue</div></div></div>
    <div class="stat-card"><div class="stat-icon blue">📅</div><div><div class="stat-val">${fmt(monthRev)}</div><div class="stat-lbl">Monthly Revenue</div></div></div>
    <div class="stat-card"><div class="stat-icon red">💸</div><div><div class="stat-val">${fmt(monthCost)}</div><div class="stat-lbl">Monthly Cost</div></div></div>
    <div class="stat-card"><div class="stat-icon ${monthProfit >= 0 ? 'green' : 'red'}">📈</div><div><div class="stat-val" style="color:${monthProfit>=0?'#2d6a4f':'#e63946'}">${fmt(monthProfit)}</div><div class="stat-lbl">Net Profit</div></div></div>`;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 86400000);
    const ds = dt.toISOString().split('T')[0];
    const rev = d.milkLog.filter(m => m.date === ds).reduce((s, m) => s + m.total, 0) * fin.pricePerLitre;
    days.push({ lbl: dt.toLocaleDateString('en-IN', { weekday: 'short' }), val: Math.round(rev) });
  }
  const maxRev = Math.max(...days.map(x => x.val), 1);
  const bars = days.map(x => `<div class="bar-wrap"><div class="bar-val">₹${x.val}</div><div class="bar" style="height:${Math.round((x.val/maxRev)*90)}px;background:linear-gradient(to top,#2d6a4f,#52b788)"></div><div class="bar-lbl">${x.lbl}</div></div>`).join('');
  document.getElementById('finance-chart').innerHTML = `<div class="card"><div class="card-heading">💰 Weekly Revenue</div><div class="bar-chart">${bars}</div></div>`;

  document.getElementById('finance-settings').innerHTML = `<div class="card"><div class="card-heading">⚙️ Price Settings</div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div><label class="field-label">Milk Price (₹/L)</label><input type="number" id="fin-price" class="field-input standalone" value="${fin.pricePerLitre}" min="10" max="200"/></div>
      <div><label class="field-label">Feed Cost/Cow/Day (₹)</label><input type="number" id="fin-feed" class="field-input standalone" value="${fin.feedCostPerCowPerDay}" min="50"/></div>
      <div><label class="field-label">Other Daily Costs (₹)</label><input type="number" id="fin-other" class="field-input standalone" value="${fin.otherCostPerDay}" min="0"/></div>
      <button class="btn-primary" onclick="saveFinanceSettings()">Save Settings ✓</button>
    </div></div>`;

  const perCow = d.cattle.filter(c => c.lactation > 0).map(c => {
    const ml = d.milkLog.filter(m => m.date >= monthStart && m.cowId === c.id).reduce((s, m) => s + m.total, 0);
    const rev = ml * fin.pricePerLitre;
    const cost = fin.feedCostPerCowPerDay * 30 + (fin.otherCostPerDay / activeCows) * 30;
    const profit = rev - cost;
    return `<tr onclick="openCowDetail('${c.id}')" style="cursor:pointer">
      <td><strong>${c.name}</strong></td><td>${ml.toFixed(1)}L</td>
      <td>${fmt(rev)}</td><td>${fmt(cost)}</td>
      <td style="color:${profit>=0?'#2d6a4f':'#e63946'};font-weight:800">${fmt(profit)}</td>
    </tr>`;
  }).join('');
  document.getElementById('finance-per-cow').innerHTML = `<div class="card"><div class="card-heading">🐄 Per Cow Profitability (30 days)</div>
    <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Cow</th><th>Milk</th><th>Revenue</th><th>Cost</th><th>Profit</th></tr></thead><tbody>${perCow}</tbody></table></div></div>`;
}

function saveFinanceSettings() {
  const d = DB.get();
  d.finance.pricePerLitre = +document.getElementById('fin-price').value || 35;
  d.finance.feedCostPerCowPerDay = +document.getElementById('fin-feed').value || 180;
  d.finance.otherCostPerDay = +document.getElementById('fin-other').value || 200;
  DB.save(); renderFinance(); showToast('Settings saved ✓', 'success');
}

/* ── ADVISORY ── */
function renderAdvisory() {
  const d = DB.get();
  const today = new Date();
  const cards = [];

  // Critical health
  d.cattle.filter(c => c.health === 'critical').forEach(c => {
    cards.push({ priority: 'critical', icon: '🚨', title: `Urgent: ${c.name} needs vet attention`, body: `${c.name} (${c.breed}) has a critical health status. Contact your vet immediately. Check body temperature and isolate from herd if needed.`, action: 'Call Vet' });
  });

  // Fever from device
  d.devices.filter(dv => dv.temp > 39.5).forEach(dv => {
    const cow = d.cattle.find(c => c.id === dv.linkedCowId);
    if (cow) cards.push({ priority: 'critical', icon: '🌡️', title: `Fever Alert: ${cow.name}`, body: `Collar ${dv.collarId} reports ${dv.temp}°C body temperature. Normal range: 38–39.5°C. Administer antipyretics and consult vet.`, action: 'Monitor Temperature' });
  });

  // Pregnant cows
  d.cattle.filter(c => c.pregnant).forEach(c => {
    cards.push({ priority: 'warning', icon: '🤰', title: `Calving Prep: ${c.name}`, body: `${c.name} is pregnant. Prepare a clean calving pen with dry bedding, colostrum supplies, and have vet contact ready. Monitor for early signs of labour.`, action: 'Prepare Calving Area' });
  });

  // Heat cycle
  d.reproductions.filter(r => r.type === 'heat' && !r.success).forEach(r => {
    const cow = d.cattle.find(c => c.id === r.cowId);
    if (cow) cards.push({ priority: 'warning', icon: '🔥', title: `AI Window Open: ${cow.name}`, body: `Standing heat detected for ${cow.name}. Optimal artificial insemination window is within the next 12–18 hours. Contact your AI technician immediately.`, action: 'Schedule AI' });
  });

  // Low battery
  d.devices.filter(dv => dv.battery < 25).forEach(dv => {
    const cow = d.cattle.find(c => c.id === dv.linkedCowId);
    cards.push({ priority: 'warning', icon: '🔋', title: `Low Battery: ${dv.collarId}`, body: `Collar ${dv.collarId}${cow ? ' on ' + cow.name : ''} has only ${dv.battery}% battery. Charge or replace within 24 hours to prevent data loss.`, action: 'Charge Collar' });
  });

  // Vaccine due
  d.vaccinations.filter(v => { const diff = Math.ceil((new Date(v.nextDue) - today) / 86400000); return diff >= 0 && diff <= 14; }).forEach(v => {
    const cow = d.cattle.find(c => c.id === v.cowId);
    const diff = Math.ceil((new Date(v.nextDue) - today) / 86400000);
    cards.push({ priority: 'info', icon: '💉', title: `Vaccine Due: ${cow ? cow.name : ''} — ${v.vaccine}`, body: `${v.vaccine} vaccination is due in ${diff} days (${v.nextDue}). Schedule with ${v.vet || 'your vet'} to avoid disease risk.`, action: 'Schedule Vaccination' });
  });

  // Offline device
  d.devices.filter(dv => dv.status === 'offline').forEach(dv => {
    cards.push({ priority: 'warning', icon: '📡', title: `Collar Offline: ${dv.collarId}`, body: `${dv.collarId} has been offline for ${timeAgo(dv.lastSync)}. Check battery and signal. Reconnect to resume health monitoring.`, action: 'Check Collar' });
  });

  // Seasonal tip
  const month = today.getMonth();
  const seasonalTips = {
    3: '🌸 Summer approaching: Ensure adequate shade and water. Increase electrolytes in feed.',
    4: '☀️ Peak summer: Monitor heat stress. Provide cool water multiple times daily.',
    5: '🌧️ Pre-monsoon: Vaccinate against FMD and HS before rains begin.',
    6: '🌧️ Monsoon: Prevent hoof rot with dry bedding. Deworm the entire herd.',
    9: '🍂 Post-monsoon: Check for tick infestations. Supplement Vitamin A & D.',
    11: '❄️ Winter: Increase energy-dense feed. Provide warm shelter at night.'
  };
  if (seasonalTips[month]) cards.push({ priority: 'info', icon: '🌤️', title: 'Seasonal Advisory', body: seasonalTips[month], action: 'Read More' });

  // General tip
  cards.push({ priority: 'info', icon: '💡', title: 'Feed Management Tip', body: 'High-producing cows need 1.5–2% of body weight in dry matter daily. Ensure balanced roughage (60%) and concentrate (40%) ratio. Add bypass protein for lactating cows.', action: '' });

  const colorMap = { critical: '#e63946', warning: '#f9c74f', info: '#52b788' };
  document.getElementById('advisory-content').innerHTML = cards.length ? cards.map(c => `
    <div class="advisory-card" style="border-left-color:${colorMap[c.priority]}">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="font-size:24px">${c.icon}</span>
        <div>
          <span class="advisory-title">${c.title}</span>
          <span class="alert-badge ${c.priority}" style="margin-left:8px">${c.priority}</span>
        </div>
      </div>
      <div class="advisory-text">${c.body}</div>
      ${c.action ? `<button class="btn-outline small" style="margin-top:12px">${c.action}</button>` : ''}
    </div>`).join('') : '<div style="text-align:center;padding:40px"><div style="font-size:48px">✅</div><p style="color:#6b7280;margin-top:12px">All good! No advisories at this time.</p></div>';
}

/* ── PROFILE ── */
function renderProfile() {
  const d = DB.get();
  const f = d.farmer;
  document.getElementById('sidebar-name').textContent = f.name;
  document.getElementById('sidebar-loc').textContent = f.village + ', ' + f.state;
  document.getElementById('profile-content').innerHTML = `
    <div class="profile-hero">
      <div class="profile-avatar">👨‍🌾</div>
      <div><div class="profile-name">${f.name}</div><div class="profile-meta">📱 +91 ${f.phone}</div><div class="profile-meta">🏡 ${f.farmName}</div></div>
    </div>
    <div class="card">
      <div id="profile-view">
        <div class="profile-row"><span class="profile-lbl">Village</span><span class="profile-val">${f.village}</span></div>
        <div class="profile-row"><span class="profile-lbl">District</span><span class="profile-val">${f.district}</span></div>
        <div class="profile-row"><span class="profile-lbl">State</span><span class="profile-val">${f.state}</span></div>
        <div class="profile-row"><span class="profile-lbl">Farm Size</span><span class="profile-val">${f.farmSize} acres</span></div>
        <div class="profile-row"><span class="profile-lbl">Total Cattle</span><span class="profile-val">${d.cattle.length}</span></div>
        <div class="profile-row"><span class="profile-lbl">Smart Collars</span><span class="profile-val">${d.devices.length}</span></div>
        <div class="profile-row"><span class="profile-lbl">Member Since</span><span class="profile-val">${f.joinDate || '2024'}</span></div>
      </div>
      <div id="profile-edit" style="display:none">
        <div class="form-grid">
          <div class="form-group"><label class="field-label">Name</label><input id="pf-name" class="field-input standalone" value="${f.name}"/></div>
          <div class="form-group"><label class="field-label">Farm Name</label><input id="pf-farm" class="field-input standalone" value="${f.farmName}"/></div>
          <div class="form-group"><label class="field-label">Village</label><input id="pf-village" class="field-input standalone" value="${f.village}"/></div>
          <div class="form-group"><label class="field-label">District</label><input id="pf-district" class="field-input standalone" value="${f.district}"/></div>
          <div class="form-group"><label class="field-label">State</label><input id="pf-state" class="field-input standalone" value="${f.state}"/></div>
          <div class="form-group"><label class="field-label">Farm Size (acres)</label><input id="pf-size" type="number" class="field-input standalone" value="${f.farmSize}"/></div>
        </div>
        <button class="btn-primary" style="margin-top:16px" onclick="saveProfile()">Save Profile ✓</button>
      </div>
    </div>
    <div class="card"><div class="card-heading">🔧 App Settings</div>
      <div class="profile-row"><span class="profile-lbl">Language</span>
        <div class="lang-pills">
          <button class="lang-pill ${APP.lang==='en'?'active':''}" onclick="setAppLang('en',this)">English</button>
          <button class="lang-pill ${APP.lang==='hi'?'active':''}" onclick="setAppLang('hi',this)">हिंदी</button>
          <button class="lang-pill ${APP.lang==='mr'?'active':''}" onclick="setAppLang('mr',this)">मराठी</button>
        </div>
      </div>
      <div class="profile-row"><span class="profile-lbl">Data Reset</span><button class="btn-del small" onclick="resetData()">Reset Demo Data</button></div>
    </div>`;
}

function toggleEditProfile() {
  const view = document.getElementById('profile-view');
  const edit = document.getElementById('profile-edit');
  const btn = document.getElementById('edit-profile-btn');
  APP.editingProfile = !APP.editingProfile;
  view.style.display = APP.editingProfile ? 'none' : 'block';
  edit.style.display = APP.editingProfile ? 'block' : 'none';
  btn.textContent = APP.editingProfile ? '✕ Cancel' : '✏️ Edit';
}

function saveProfile() {
  const d = DB.get();
  d.farmer.name = document.getElementById('pf-name').value || d.farmer.name;
  d.farmer.farmName = document.getElementById('pf-farm').value || d.farmer.farmName;
  d.farmer.village = document.getElementById('pf-village').value || d.farmer.village;
  d.farmer.district = document.getElementById('pf-district').value || d.farmer.district;
  d.farmer.state = document.getElementById('pf-state').value || d.farmer.state;
  d.farmer.farmSize = document.getElementById('pf-size').value || d.farmer.farmSize;
  DB.save(); APP.editingProfile = false; renderProfile();
  showToast('Profile saved ✓', 'success');
}

function resetData() {
  if (!confirm('Reset all data to demo defaults?')) return;
  DB.reset(); renderAll(); showToast('Data reset to demo defaults', 'warning');
}
