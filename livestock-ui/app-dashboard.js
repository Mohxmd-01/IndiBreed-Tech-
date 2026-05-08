'use strict';
/* ============================================================
   NiralFarm — Dashboard Module   v4.0
   ============================================================ */

function renderDashboard() {
  const d = DB.get();
  const today = todayStr();

  // Greeting
  const gEl = document.getElementById('dash-greeting');
  if (gEl) gEl.textContent = greetingText();

  // Today's milk total
  const todayMilk = d.milkLog.filter(m => m.date === today).reduce((s, m) => s + m.total, 0).toFixed(1);
  const activeAlerts = d.alerts.filter(a => !a.resolved).length;
  const healthyCnt = d.cattle.filter(c => c.health === 'healthy').length;

  // Stats
  const statsEl = document.getElementById('dash-stats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat-card"><div class="stat-icon green">🐄</div><div><div class="stat-val">${d.cattle.length}</div><div class="stat-lbl">Total Cattle</div></div></div>
    <div class="stat-card"><div class="stat-icon green">💚</div><div><div class="stat-val">${healthyCnt}</div><div class="stat-lbl">Healthy</div></div></div>
    <div class="stat-card"><div class="stat-icon blue">🥛</div><div><div class="stat-val">${todayMilk}L</div><div class="stat-lbl">Today's Milk</div></div></div>
    <div class="stat-card"><div class="stat-icon ${activeAlerts > 0 ? 'red' : 'green'}">🔔</div><div><div class="stat-val">${activeAlerts}</div><div class="stat-lbl">Active Alerts</div></div></div>
    <div class="stat-card"><div class="stat-icon purple">📡</div><div><div class="stat-val">${d.devices.filter(dv => dv.status === 'online').length}</div><div class="stat-lbl">Collars Online</div></div></div>
  `;

  // Quick actions
  const quickEl = document.getElementById('dash-quick');
  if (quickEl) quickEl.innerHTML = `
    <div class="card"><div class="card-heading">⚡ Quick Actions</div>
    <div class="quick-grid">
      <button class="quick-btn" onclick="openModal('modal-add-cattle')"><span class="q-icon">🐄</span>Add Cattle</button>
      <button class="quick-btn" onclick="openModal('modal-record-milk')"><span class="q-icon">🥛</span>Record Milk</button>
      <button class="quick-btn" onclick="openModal('modal-add-vaccine')"><span class="q-icon">💉</span>Add Vaccine</button>
      <button class="quick-btn" onclick="openModal('modal-add-device')"><span class="q-icon">📡</span>Add Collar</button>
    </div></div>`;

  // Weekly milk bar chart (last 7 days)
  const chartEl = document.getElementById('dash-chart');
  if (chartEl) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(Date.now() - i * 86400000);
      const ds = dt.toISOString().split('T')[0];
      const total = d.milkLog.filter(m => m.date === ds).reduce((s, m) => s + m.total, 0);
      days.push({ lbl: dt.toLocaleDateString('en-IN', {weekday:'short'}), val: +total.toFixed(1) });
    }
    const max = Math.max(...days.map(x => x.val), 1);
    const bars = days.map(x => {
      const h = Math.round((x.val / max) * 90);
      return `<div class="bar-wrap"><div class="bar-val">${x.val}L</div><div class="bar" style="height:${h}px"></div><div class="bar-lbl">${x.lbl}</div></div>`;
    }).join('');
    chartEl.innerHTML = `<div class="card"><div class="card-heading">📊 Weekly Milk (L)</div><div class="bar-chart">${bars}</div></div>`;
  }

  // Health donut
  const donutEl = document.getElementById('dash-health-donut');
  if (donutEl) {
    const total = d.cattle.length || 1;
    const hw = Math.round((healthyCnt / total) * 100);
    const warn = d.cattle.filter(c => c.health === 'warning').length;
    const crit = d.cattle.filter(c => c.health === 'critical').length;
    const ww = Math.round((warn / total) * 100);
    const cw = Math.round((crit / total) * 100);
    donutEl.innerHTML = `<div class="card"><div class="card-heading">🏥 Herd Health</div>
      <div class="donut-wrap">
        <div class="donut-ring" style="background:conic-gradient(#52b788 0% ${hw}%,#f9c74f ${hw}% ${hw+ww}%,#e63946 ${hw+ww}% 100%)"></div>
        <div class="donut-legend">
          <div class="dl-item"><span class="dl-dot" style="background:#52b788"></span>Healthy ${healthyCnt}</div>
          <div class="dl-item"><span class="dl-dot" style="background:#f9c74f"></span>Warning ${warn}</div>
          <div class="dl-item"><span class="dl-dot" style="background:#e63946"></span>Critical ${crit}</div>
        </div>
      </div></div>`;
  }

  // Top alerts preview
  const alertsEl = document.getElementById('dash-alerts-preview');
  if (alertsEl) {
    const top = d.alerts.filter(a => !a.resolved).slice(0, 3);
    const rows = top.map(a => `
      <div class="alert-card ${a.type}" style="margin-bottom:8px">
        <div class="alert-icon">${a.type === 'critical' ? '🚨' : a.type === 'warning' ? '⚠️' : 'ℹ️'}</div>
        <div class="alert-body"><div class="alert-title">${a.cowName} — ${a.title}</div><div class="alert-time">${timeAgo(a.time)}</div></div>
      </div>`).join('');
    alertsEl.innerHTML = `<div class="card"><div class="card-heading">🔔 Recent Alerts <button class="link-btn" onclick="showSection('alerts')">View All →</button></div>${rows || '<p style="color:#6b7280;font-size:14px">No active alerts 🎉</p>'}</div>`;
  }

  // Herd mini-table
  const tableEl = document.getElementById('dash-herd-table');
  if (tableEl) {
    const rows = d.cattle.map(c => {
      const milk = d.milkLog.filter(m => m.date === today && m.cowId === c.id).reduce((s, m) => s + m.total, 0).toFixed(1);
      const dev = d.devices.find(dv => dv.linkedCowId === c.id);
      return `<tr onclick="openCowDetail('${c.id}')" style="cursor:pointer">
        <td><strong>${c.name}</strong><br><span style="font-size:11px;color:#6b7280">${c.tagId}</span></td>
        <td>${c.breed}</td>
        <td><span class="health-tag ${c.health}">${healthIcon(c.health)} ${healthLabel(c.health)}</span></td>
        <td><strong>${milk}L</strong></td>
        <td>${dev ? `<span style="color:${dev.status==='online'?'#2d6a4f':'#e63946'};font-weight:800">${dev.status==='online'?'●':'○'} ${dev.collarId}</span>` : '<span style="color:#9ca3af">No collar</span>'}</td>
      </tr>`;
    }).join('');
    tableEl.innerHTML = `<div class="card"><div class="card-heading">🐄 Herd Overview</div>
      <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Name</th><th>Breed</th><th>Health</th><th>Today's Milk</th><th>Collar</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  updateAlertBadge();
}
