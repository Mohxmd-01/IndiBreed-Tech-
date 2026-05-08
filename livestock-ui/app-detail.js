'use strict';
/* NiralFarm — Cow Detail Module v4.0 */

function openCowDetail(id) {
  APP.currentCowId = id;
  APP.currentCowTab = 'live';
  const d = DB.get();
  const c = d.cattle.find(x => x.id === id);
  if (!c) return;
  showSection('cow-detail');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-cow-detail').classList.add('active');

  // Hero
  const dev = d.devices.find(dv => dv.linkedCowId === id);
  document.getElementById('cow-detail-hero').innerHTML = `
    <div class="cow-hero-card">
      <div class="cow-hero-avatar">${c.health === 'critical' ? '🤒' : c.pregnant ? '🤰' : '🐄'}</div>
      <div class="cow-hero-info">
        <h2>${c.name} <span class="health-tag ${c.health}">${healthIcon(c.health)} ${healthLabel(c.health)}</span></h2>
        <div class="cow-hero-meta">
          <span>🏷️ ${c.tagId}</span><span>🐮 ${c.breed}</span>
          <span>📅 ${c.age} yrs</span><span>⚖️ ${c.weight}kg</span>
          <span>🥛 ${lactLabel(c.lactation)}</span>
          ${c.pregnant ? '<span style="color:#e63946;font-weight:800">🤰 Pregnant</span>' : ''}
        </div>
        ${dev ? `<div class="cow-collar-badge ${dev.status}">📡 ${dev.collarId} · ${dev.status} · 🔋${dev.battery}%</div>` : '<div class="cow-collar-badge offline">No collar linked</div>'}
      </div>
    </div>`;

  // Tab buttons active state
  document.querySelectorAll('.cow-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.cow-tab[onclick*="live"]').classList.add('active');

  renderCowTab('live');
}

function setCowTab(tab, btn) {
  APP.currentCowTab = tab;
  document.querySelectorAll('.cow-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderCowTab(tab);
}

function renderCowTab(tab) {
  if (APP.sensorInterval) { clearInterval(APP.sensorInterval); APP.sensorInterval = null; }
  const el = document.getElementById('cow-detail-content');
  if (!el) return;
  const id = APP.currentCowId;
  const d = DB.get();
  const c = d.cattle.find(x => x.id === id);
  if (!c) return;

  if (tab === 'live') renderLiveTab(el, c, d);
  else if (tab === 'milk') renderMilkTab(el, c, d);
  else if (tab === 'health') renderHealthTab(el, c, d);
  else if (tab === 'vaccine') renderVaccineTab(el, c, d);
  else if (tab === 'repro') renderReproTab(el, c, d);
  else if (tab === 'location') renderLocationTab(el, c, d);
}

function renderLiveTab(el, c, d) {
  const dev = d.devices.find(dv => dv.linkedCowId === c.id);
  if (!dev) { el.innerHTML = '<div class="card" style="text-align:center;padding:40px"><div style="font-size:48px">📡</div><p style="margin-top:12px;color:#6b7280">No smart collar linked to this cow.<br><button class="btn-primary small" style="margin-top:16px" onclick="openModal(\'modal-add-device\')">Add Collar</button></p></div>'; return; }

  function renderGauges() {
    const dv = DB.get().devices.find(x => x.id === dev.id) || dev;
    const tempColor = dv.temp > 39.5 ? '#e63946' : dv.temp > 39 ? '#f9c74f' : '#52b788';
    const actColor = dv.activity > 60 ? '#52b788' : dv.activity > 30 ? '#f9c74f' : '#e63946';
    el.innerHTML = `
      <div class="card"><div class="card-heading">📡 Live Sensor Data <span style="font-size:12px;color:#6b7280">Auto-refresh every 5s</span></div>
        <div class="sensor-grid">
          <div class="sensor-card">
            <div class="sensor-ring-wrap">
              <svg class="sensor-ring" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" stroke-width="10"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="${tempColor}" stroke-width="10" stroke-dasharray="${Math.round(((dv.temp-36)/6)*264)} 264" stroke-dashoffset="66" stroke-linecap="round"/>
              </svg>
              <div class="sensor-center"><div class="sensor-val" style="color:${tempColor}">${dv.temp.toFixed(1)}°C</div><div class="sensor-unit">Body Temp</div></div>
            </div>
            <div class="sensor-status" style="color:${tempColor}">${dv.temp > 39.5 ? '🚨 Fever' : dv.temp > 39 ? '⚠️ Elevated' : '✅ Normal'}</div>
          </div>
          <div class="sensor-card">
            <div class="sensor-ring-wrap">
              <svg class="sensor-ring" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" stroke-width="10"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="${actColor}" stroke-width="10" stroke-dasharray="${Math.round(dv.activity*2.64)} 264" stroke-dashoffset="66" stroke-linecap="round"/>
              </svg>
              <div class="sensor-center"><div class="sensor-val" style="color:${actColor}">${dv.activity}%</div><div class="sensor-unit">Activity</div></div>
            </div>
            <div class="sensor-status" style="color:${actColor}">${dv.activity > 60 ? '🏃 Active' : dv.activity > 30 ? '🚶 Moderate' : '😴 Low'}</div>
          </div>
          <div class="sensor-card">
            <div style="font-size:32px;margin-bottom:8px">🔋</div>
            <div class="sensor-val" style="color:${getBattColor(dv.battery)}">${dv.battery}%</div>
            <div class="sensor-unit">Battery</div>
            ${miniBar(dv.battery, 100, getBattColor(dv.battery))}
          </div>
          <div class="sensor-card">
            <div style="font-size:32px;margin-bottom:8px">📶</div>
            <div class="sensor-val" style="color:#457b9d">${dv.signal}%</div>
            <div class="sensor-unit">Signal</div>
            ${miniBar(dv.signal, 100, '#457b9d')}
            <div style="font-size:11px;color:#6b7280;margin-top:8px">Last sync: ${timeAgo(dv.lastSync)}</div>
          </div>
        </div>
        <div style="margin-top:16px;padding:12px;background:#f9fafb;border-radius:12px;font-size:13px;color:#6b7280">
          <strong>Collar ID:</strong> ${dv.collarId} &nbsp;|&nbsp; <strong>Firmware:</strong> ${dv.firmware} &nbsp;|&nbsp; <strong>Status:</strong> <span style="color:${dv.status==='online'?'#2d6a4f':'#e63946'};font-weight:800">${dv.status}</span>
        </div>
      </div>`;
  }

  renderGauges();
  APP.sensorInterval = setInterval(() => {
    const dv = DB.get().devices.find(x => x.id === dev.id);
    if (!dv) return;
    dv.temp = +(dv.temp + (Math.random()-0.5)*0.2).toFixed(1);
    dv.activity = Math.min(100, Math.max(0, Math.round(dv.activity + (Math.random()-0.5)*5)));
    DB.save();
    if (APP.currentCowTab === 'live') renderGauges();
  }, 5000);
}

function renderMilkTab(el, c, d) {
  const logs = d.milkLog.filter(m => m.cowId === c.id).sort((a,b) => a.date.localeCompare(b.date));
  const last7 = logs.slice(-7);
  const last30 = logs.slice(-30);
  const weekTotal = last7.reduce((s,m) => s + m.total, 0).toFixed(1);
  const monthTotal = last30.reduce((s,m) => s + m.total, 0).toFixed(1);
  const max = Math.max(...last7.map(m => m.total), 1);
  const bars = last7.map(m => {
    const h = Math.round((m.total/max)*90);
    const dt = new Date(m.date);
    return `<div class="bar-wrap">
      <div class="bar-val">${m.total}L</div>
      <div style="display:flex;gap:2px;height:${h}px;align-items:flex-end">
        <div style="background:#52b788;width:10px;height:${Math.round((m.morning/m.total||0)*h)}px;border-radius:3px 3px 0 0"></div>
        <div style="background:#74c69d;width:10px;height:${Math.round((m.evening/m.total||0)*h)}px;border-radius:3px 3px 0 0"></div>
      </div>
      <div class="bar-lbl">${dt.toLocaleDateString('en-IN',{weekday:'short'})}</div>
    </div>`;
  }).join('');
  const tbl = last7.slice().reverse().map(m => `<tr><td>${m.date}</td><td>${m.morning}L</td><td>${m.evening}L</td><td><strong>${m.total}L</strong></td></tr>`).join('');
  el.innerHTML = `
    <div class="card"><div class="card-heading">🥛 Milk Production</div>
      <div class="sensor-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="sensor-card"><div class="sensor-val" style="color:#2d6a4f">${weekTotal}L</div><div class="sensor-unit">This Week</div></div>
        <div class="sensor-card"><div class="sensor-val" style="color:#457b9d">${monthTotal}L</div><div class="sensor-unit">This Month</div></div>
        <div class="sensor-card"><div class="sensor-val" style="color:#9d4edd">${c.milkAvg}L</div><div class="sensor-unit">Daily Avg</div></div>
      </div>
      <div style="margin:20px 0 8px;font-weight:800;font-size:14px">📊 Last 7 Days <span style="font-size:11px;font-weight:600;color:#6b7280">&nbsp;🟢 Morning &nbsp;🌿 Evening</span></div>
      <div class="bar-chart" style="height:110px">${bars}</div>
    </div>
    <div class="card"><div class="card-heading">📋 Daily Records</div>
      <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Date</th><th>Morning</th><th>Evening</th><th>Total</th></tr></thead><tbody>${tbl}</tbody></table></div>
    </div>`;
}

function renderHealthTab(el, c, d) {
  const hist = (d.healthHistory || []).filter(h => h.cowId === c.id).sort((a,b) => b.date.localeCompare(a.date));
  const items = hist.map(h => `
    <div class="timeline-item">
      <div class="timeline-dot" style="background:#457b9d"></div>
      <div class="timeline-body">
        <div style="font-weight:800;font-size:14px">${h.issue}</div>
        <div style="font-size:12px;color:#6b7280">${h.date} · ${h.vet}</div>
        <div style="font-size:13px;margin-top:4px">${h.treatment}</div>
        ${h.notes ? `<div style="font-size:12px;color:#6b7280;margin-top:2px">${h.notes}</div>` : ''}
      </div>
    </div>`).join('') || '<p style="color:#6b7280">No health history recorded.</p>';
  el.innerHTML = `
    <div class="card"><div class="card-heading">❤️ Health Summary</div>
      <div class="sensor-grid" style="grid-template-columns:repeat(2,1fr)">
        <div class="sensor-card"><div style="font-size:28px">${healthIcon(c.health)}</div><div class="sensor-val">${healthLabel(c.health)}</div><div class="sensor-unit">Current Status</div></div>
        <div class="sensor-card"><div style="font-size:28px">⚖️</div><div class="sensor-val">${c.weight}kg</div><div class="sensor-unit">Body Weight</div></div>
      </div>
    </div>
    <div class="card"><div class="card-heading">🏥 Health History</div><div class="timeline">${items}</div></div>`;
}

function renderVaccineTab(el, c, d) {
  const vacs = d.vaccinations.filter(v => v.cowId === c.id).sort((a,b) => b.date.localeCompare(a.date));
  const today = new Date();
  const rows = vacs.map(v => {
    const due = new Date(v.nextDue);
    const diff = Math.ceil((due - today) / 86400000);
    const dueClass = diff < 0 ? 'color:#e63946;font-weight:800' : diff < 30 ? 'color:#f9c74f;font-weight:800' : 'color:#52b788';
    return `<tr><td>${v.vaccine}</td><td>${v.date}</td><td style="${dueClass}">${v.nextDue} (${diff<0?'Overdue':diff+' days'})</td><td>${v.vet}</td><td>${v.notes||'—'}</td></tr>`;
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:#6b7280">No records</td></tr>';
  el.innerHTML = `<div class="card"><div class="card-heading">💉 Vaccination Records</div>
    <div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Vaccine</th><th>Given</th><th>Next Due</th><th>Vet</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table></div>
    <button class="btn-primary small" style="margin-top:16px" onclick="openModal('modal-add-vaccine')">+ Add Vaccine Record</button>
  </div>`;
}

function renderReproTab(el, c, d) {
  const reps = d.reproductions.filter(r => r.cowId === c.id).sort((a,b) => b.date.localeCompare(a.date));
  const typeIcon = t => t === 'AI' ? '💉' : t === 'calving' ? '🐣' : '🔥';
  const items = reps.map(r => `
    <div class="timeline-item">
      <div class="timeline-dot" style="background:${r.type==='calving'?'#52b788':r.type==='AI'?'#457b9d':'#f9c74f'}"></div>
      <div class="timeline-body">
        <div style="font-weight:800">${typeIcon(r.type)} ${r.type.toUpperCase()} — ${r.date}</div>
        ${r.bull ? `<div style="font-size:12px;color:#6b7280">Bull/Semen: ${r.bull}</div>` : ''}
        ${r.calf ? `<div style="font-size:13px">🐄 Calf: ${r.calf}, ${r.calfWeight}kg</div>` : ''}
        <div style="font-size:13px;margin-top:2px">${r.notes}</div>
        ${r.type==='AI' ? `<span style="font-size:12px;background:${r.success?'#d8f3dc':'#fee2e2'};color:${r.success?'#2d6a4f':'#e63946'};padding:2px 8px;border-radius:10px;font-weight:800">${r.success?'✓ Success':'✗ Unsuccessful'}</span>` : ''}
      </div>
    </div>`).join('') || '<p style="color:#6b7280">No reproduction records.</p>';
  el.innerHTML = `<div class="card"><div class="card-heading">🐣 Reproduction Tracking</div>
    ${c.pregnant ? '<div style="background:#fef9c3;border-radius:12px;padding:14px;margin-bottom:16px;font-weight:700;color:#92400e">🤰 Currently Pregnant — Monitor calving date</div>' : ''}
    <div class="timeline">${items}</div>
  </div>`;
}

function renderLocationTab(el, c, d) {
  const dev = d.devices.find(dv => dv.linkedCowId === c.id);
  if (!dev || !dev.lat) {
    el.innerHTML = '<div class="card" style="text-align:center;padding:40px"><div style="font-size:48px">📍</div><p style="margin-top:12px;color:#6b7280">GPS data not available. Ensure collar has GPS enabled.</p></div>';
    return;
  }
  // Generate nearby cow positions for the map
  const otherDevs = d.devices.filter(dv => dv.linkedCowId !== c.id && dv.status === 'online').slice(0, 4);
  const pins = otherDevs.map((dv,i) => {
    const ox = 80 + i * 60, oy = 60 + (i%2)*80;
    const cow = d.cattle.find(x => x.id === dv.linkedCowId);
    return `<circle cx="${ox}" cy="${oy}" r="10" fill="#74c69d" opacity="0.8"/>
      <text x="${ox}" y="${oy+4}" text-anchor="middle" font-size="10" fill="#fff">🐄</text>
      <text x="${ox}" y="${oy+22}" text-anchor="middle" font-size="9" fill="#2d6a4f" font-weight="bold">${cow?cow.name:''}</text>`;
  }).join('');
  el.innerHTML = `<div class="card"><div class="card-heading">📍 Live Location</div>
    <div class="map-container">
      <svg width="100%" height="300" style="background:linear-gradient(135deg,#d8f3dc,#b7e4c7);border-radius:12px;border:2px solid #52b788">
        <!-- Farm boundary -->
        <rect x="20" y="20" width="560" height="260" rx="12" fill="none" stroke="#2d6a4f" stroke-width="2" stroke-dasharray="8,4"/>
        <!-- Field zones -->
        <rect x="40" y="40" width="200" height="100" rx="8" fill="rgba(82,183,136,0.15)" stroke="#74c69d" stroke-width="1"/>
        <text x="140" y="85" text-anchor="middle" font-size="11" fill="#2d6a4f" font-weight="bold">Grazing Field A</text>
        <rect x="260" y="40" width="300" height="100" rx="8" fill="rgba(69,123,157,0.1)" stroke="#74c69d" stroke-width="1"/>
        <text x="410" y="85" text-anchor="middle" font-size="11" fill="#2d6a4f" font-weight="bold">Grazing Field B</text>
        <rect x="40" y="160" width="250" height="100" rx="8" fill="rgba(249,199,79,0.1)" stroke="#74c69d" stroke-width="1"/>
        <text x="165" y="210" text-anchor="middle" font-size="11" fill="#2d6a4f" font-weight="bold">Shed Area</text>
        <!-- Other cows -->
        ${pins}
        <!-- This cow (pulsing) -->
        <circle cx="160" cy="210" r="16" fill="#2d6a4f" opacity="0.3"><animate attributeName="r" values="16;22;16" dur="1.5s" repeatCount="indefinite"/></circle>
        <circle cx="160" cy="210" r="12" fill="#2d6a4f"/>
        <text x="160" y="215" text-anchor="middle" font-size="14">🐄</text>
        <text x="160" y="235" text-anchor="middle" font-size="10" fill="#1b4332" font-weight="bold">${c.name}</text>
      </svg>
    </div>
    <div style="margin-top:16px;display:flex;gap:16px;font-size:13px;flex-wrap:wrap">
      <span>📍 Lat: ${dev.lat.toFixed(4)}</span>
      <span>📍 Lng: ${dev.lng.toFixed(4)}</span>
      <span>🕐 Updated: ${timeAgo(dev.lastSync)}</span>
      <span style="color:${dev.status==='online'?'#2d6a4f':'#e63946'};font-weight:800">● ${dev.status}</span>
    </div>
  </div>`;
}
