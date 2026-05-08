'use strict';
/* NiralFarm — Devices, Milk, Alerts, Health v4.0 */

/* ── DEVICES ── */
function renderDevices() {
  const d = DB.get();
  const online = d.devices.filter(x => x.status === 'online').length;
  const lowBat = d.devices.filter(x => x.battery < 30).length;
  document.getElementById('devices-stats').innerHTML = `
    <div class="stat-card"><div class="stat-icon blue">📡</div><div><div class="stat-val">${d.devices.length}</div><div class="stat-lbl">Total Collars</div></div></div>
    <div class="stat-card"><div class="stat-icon green">✅</div><div><div class="stat-val">${online}</div><div class="stat-lbl">Online</div></div></div>
    <div class="stat-card"><div class="stat-icon red">⚫</div><div><div class="stat-val">${d.devices.length - online}</div><div class="stat-lbl">Offline</div></div></div>
    <div class="stat-card"><div class="stat-icon yellow">🔋</div><div><div class="stat-val">${lowBat}</div><div class="stat-lbl">Low Battery</div></div></div>`;
  document.getElementById('devices-list').innerHTML = d.devices.map(dv => {
    const cow = d.cattle.find(c => c.id === dv.linkedCowId);
    return `<div class="device-card">
      <div class="device-icon">📡</div>
      <div class="device-info">
        <div class="device-id">${dv.collarId}</div>
        <div class="device-cow">${cow ? '🐄 ' + cow.name : '<em>Unlinked</em>'}</div>
        <div style="margin-top:8px">${miniBar(dv.battery,100,getBattColor(dv.battery))}</div>
        <div style="font-size:12px;margin-top:4px;color:#6b7280">🔋 ${dv.battery}% · 📶 ${dv.signal}% · 🕐 ${timeAgo(dv.lastSync)}</div>
        <div style="font-size:11px;color:#9ca3af">FW: ${dv.firmware} · Temp: ${dv.temp}°C</div>
      </div>
      <span class="device-status ${dv.status}">${dv.status}</span>
    </div>`;
  }).join('');
}

function populateCollarCowDropdowns() {
  const d = DB.get();
  const opts = d.cattle.map(c => `<option value="${c.id}">${c.name} (${c.tagId})</option>`).join('');
  ['add-collar-cow','add-collar-cow-qr'].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = opts; });
}

function simulateQrScan() {
  const id = 'SC-' + Math.floor(1000 + Math.random()*8999);
  const res = document.getElementById('qr-result');
  res.style.display = 'block'; res.textContent = '✅ Scanned: ' + id;
  document.getElementById('add-collar-id').value = id;
}

function addDevice() {
  const isQr = document.getElementById('dtab-qr').classList.contains('active');
  const collarId = document.getElementById('add-collar-id').value.trim();
  const cowId = isQr ? document.getElementById('add-collar-cow-qr').value : document.getElementById('add-collar-cow').value;
  if (!collarId) { showToast('Enter or scan a Collar ID','error'); return; }
  const d = DB.get();
  if (d.devices.find(dv => dv.collarId === collarId)) { showToast('Collar ID already exists','error'); return; }
  d.devices.push({ id:'DEV'+Date.now(), collarId, linkedCowId:cowId, battery:100, signal:90, lastSync:Date.now(), status:'online', firmware:'v2.3.2', temp:38.5, activity:60, lat:20.012, lng:73.789 });
  const cow = d.cattle.find(c => c.id === cowId);
  if (cow) cow.collarId = collarId;
  DB.save(); closeAllModals(); renderDevices();
  showToast(collarId + ' added & linked ✓','success');
}

/* ── MILK ── */
function renderMilk() {
  const d = DB.get();
  const today = todayStr();
  const weekStart = new Date(Date.now()-6*86400000).toISOString().split('T')[0];
  const monthStart = new Date(Date.now()-29*86400000).toISOString().split('T')[0];
  const todayL = d.milkLog.filter(m=>m.date===today).reduce((s,m)=>s+m.total,0).toFixed(1);
  const weekL = d.milkLog.filter(m=>m.date>=weekStart).reduce((s,m)=>s+m.total,0).toFixed(1);
  const monthL = d.milkLog.filter(m=>m.date>=monthStart).reduce((s,m)=>s+m.total,0).toFixed(1);
  const todayLogs = d.milkLog.filter(m=>m.date===today);
  const topCow = d.cattle.reduce((best,c)=>{ const t=todayLogs.filter(m=>m.cowId===c.id).reduce((s,m)=>s+m.total,0); return t>(best.val||0)?{name:c.name,val:t}:best; },{});

  document.getElementById('milk-stats').innerHTML = `
    <div class="stat-card"><div class="stat-icon blue">🥛</div><div><div class="stat-val">${todayL}L</div><div class="stat-lbl">Today's Total</div></div></div>
    <div class="stat-card"><div class="stat-icon green">📊</div><div><div class="stat-val">${weekL}L</div><div class="stat-lbl">This Week</div></div></div>
    <div class="stat-card"><div class="stat-icon purple">📅</div><div><div class="stat-val">${monthL}L</div><div class="stat-lbl">This Month</div></div></div>
    <div class="stat-card"><div class="stat-icon yellow">🏆</div><div><div class="stat-val">${topCow.name||'—'}</div><div class="stat-lbl">Top Producer</div></div></div>`;

  const days=[];
  for(let i=6;i>=0;i--){const dt=new Date(Date.now()-i*86400000);const ds=dt.toISOString().split('T')[0];const t=d.milkLog.filter(m=>m.date===ds).reduce((s,m)=>s+m.total,0);days.push({lbl:dt.toLocaleDateString('en-IN',{weekday:'short'}),val:+t.toFixed(1)});}
  const max=Math.max(...days.map(x=>x.val),1);
  const bars=days.map(x=>`<div class="bar-wrap"><div class="bar-val">${x.val}L</div><div class="bar" style="height:${Math.round((x.val/max)*90)}px"></div><div class="bar-lbl">${x.lbl}</div></div>`).join('');
  document.getElementById('milk-chart').innerHTML=`<div class="card"><div class="card-heading">📊 Weekly Yield</div><div class="bar-chart">${bars}</div></div>`;
  document.getElementById('milk-entry-quick').innerHTML=`<div class="card"><div class="card-heading">⚡ Quick Record</div><button class="btn-primary" onclick="openModal('modal-record-milk')">🥛 Record Milk Yield</button><p style="font-size:12px;color:#6b7280;margin-top:10px">Record morning and evening yield</p></div>`;

  const rows=d.cattle.filter(c=>c.lactation>0).map(c=>{
    const t=todayLogs.filter(m=>m.cowId===c.id).reduce((s,m)=>s+m.total,0).toFixed(1);
    const wk=d.milkLog.filter(m=>m.date>=weekStart&&m.cowId===c.id).reduce((s,m)=>s+m.total,0);
    return `<tr onclick="openCowDetail('${c.id}')" style="cursor:pointer"><td><strong>${c.name}</strong></td><td>${c.breed}</td><td><strong>${t}L</strong></td><td>${(wk/7).toFixed(1)}L</td><td>${+t>=(wk/7)?'📈':'📉'}</td></tr>`;
  }).join('');
  document.getElementById('milk-per-cow').innerHTML=`<div class="card"><div class="card-heading">🐄 Per Cow Yield</div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Cow</th><th>Breed</th><th>Today</th><th>7-Day Avg</th><th>Trend</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function populateMilkCowDropdown(){
  const d=DB.get();const el=document.getElementById('milk-cow-select');
  if(el)el.innerHTML=d.cattle.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  const dt=document.getElementById('milk-date');if(dt&&!dt.value)dt.value=todayStr();
}

function recordMilk(){
  const cowId=document.getElementById('milk-cow-select').value;
  const morning=+document.getElementById('milk-morning').value||0;
  const evening=+document.getElementById('milk-evening').value||0;
  const date=document.getElementById('milk-date').value||todayStr();
  if(!morning&&!evening){showToast('Enter at least one yield value','error');return;}
  const d=DB.get();
  const ex=d.milkLog.find(m=>m.cowId===cowId&&m.date===date);
  if(ex){ex.morning=morning;ex.evening=evening;ex.total=+(morning+evening).toFixed(1);}
  else d.milkLog.push({id:'ML-'+Date.now(),cowId,date,morning,evening,total:+(morning+evening).toFixed(1)});
  DB.save();closeAllModals();renderMilk();renderDashboard();showToast('Milk recorded ✓','success');
}

/* ── ALERTS ── */
function renderAlerts(){
  const d=DB.get();const f=APP.alertFilter;
  const list=d.alerts.filter(a=>f==='all'?true:f==='resolved'?a.resolved:(!a.resolved&&a.type===f));
  const chips={critical:d.alerts.filter(a=>a.type==='critical'&&!a.resolved).length,warning:d.alerts.filter(a=>a.type==='warning'&&!a.resolved).length,info:d.alerts.filter(a=>a.type==='info'&&!a.resolved).length};
  document.getElementById('alerts-chips').innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap">${chips.critical?`<span class="alert-badge critical">🚨 ${chips.critical} Critical</span>`:''}${chips.warning?`<span class="alert-badge warning">⚠️ ${chips.warning} Warning</span>`:''}${chips.info?`<span class="alert-badge info">ℹ️ ${chips.info} Info</span>`:''}</div>`;
  document.getElementById('alerts-grid').innerHTML=list.length?list.map(a=>`
    <div class="alert-card ${a.resolved?'resolved':a.type}">
      <div class="alert-icon">${a.type==='critical'?'🚨':a.type==='warning'?'⚠️':'ℹ️'}</div>
      <div class="alert-body"><div class="alert-title">${a.cowName} — ${a.title}</div><div class="alert-desc">${a.desc}</div>${a.action?`<div style="margin-top:8px;font-size:13px;font-weight:800;color:#2d6a4f">👉 ${a.action}</div>`:''}<div class="alert-time">${timeAgo(a.time)}</div></div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end"><span class="alert-badge ${a.resolved?'resolved':a.type}">${a.resolved?'Resolved':a.type}</span>${!a.resolved?`<button class="btn-outline small" onclick="resolveAlert('${a.id}')">✓ Resolve</button>`:''}</div>
    </div>`).join(''):'<div style="text-align:center;padding:40px;color:#6b7280">No alerts here 🎉</div>';
  updateAlertBadge();
}

function resolveAlert(id){
  const d=DB.get();const a=d.alerts.find(x=>x.id===id);
  if(a){a.resolved=true;DB.save();renderAlerts();updateAlertBadge();showToast('Alert resolved ✓','success');}
}

/* ── HEALTH ── */
function renderHealth(){
  const d=DB.get();const today=new Date();
  const healthy=d.cattle.filter(c=>c.health==='healthy').length;
  const warn=d.cattle.filter(c=>c.health==='warning').length;
  const crit=d.cattle.filter(c=>c.health==='critical').length;
  const dueSoon=d.vaccinations.filter(v=>{const diff=Math.ceil((new Date(v.nextDue)-today)/86400000);return diff>=0&&diff<=30;}).length;
  document.getElementById('health-stats').innerHTML=`
    <div class="stat-card"><div class="stat-icon green">💚</div><div><div class="stat-val">${healthy}</div><div class="stat-lbl">Healthy</div></div></div>
    <div class="stat-card"><div class="stat-icon yellow">⚠️</div><div><div class="stat-val">${warn}</div><div class="stat-lbl">Warning</div></div></div>
    <div class="stat-card"><div class="stat-icon red">🚨</div><div><div class="stat-val">${crit}</div><div class="stat-lbl">Critical</div></div></div>
    <div class="stat-card"><div class="stat-icon purple">💉</div><div><div class="stat-val">${dueSoon}</div><div class="stat-lbl">Vaccine Due</div></div></div>`;

  const rows=d.cattle.map(c=>{
    const lastVac=d.vaccinations.filter(v=>v.cowId===c.id).sort((a,b)=>b.date.localeCompare(a.date))[0];
    const nextDue=lastVac?lastVac.nextDue:'—';
    const diff=lastVac?Math.ceil((new Date(lastVac.nextDue)-today)/86400000):999;
    return `<tr onclick="openCowDetail('${c.id}')" style="cursor:pointer"><td><strong>${c.name}</strong></td><td><span class="health-tag ${c.health}">${healthIcon(c.health)} ${healthLabel(c.health)}</span></td><td>${c.breed}</td><td>${c.age}yrs</td><td style="${diff<0?'color:#e63946;font-weight:800':diff<30?'color:#f9c74f;font-weight:800':''}">${nextDue}${diff<0?' ⚠️':diff<30?' 🔔':''}</td></tr>`;
  }).join('');
  document.getElementById('health-table-card').innerHTML=`<div class="card"><div class="card-heading">🐄 Herd Health</div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Name</th><th>Status</th><th>Breed</th><th>Age</th><th>Next Vaccine</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;

  const upVacs=d.vaccinations.filter(v=>{const diff=Math.ceil((new Date(v.nextDue)-today)/86400000);return diff>=0&&diff<=60;}).sort((a,b)=>a.nextDue.localeCompare(b.nextDue)).slice(0,8);
  const vacRows=upVacs.map(v=>{const cow=d.cattle.find(c=>c.id===v.cowId);const diff=Math.ceil((new Date(v.nextDue)-today)/86400000);return `<tr><td>${cow?cow.name:v.cowId}</td><td>${v.vaccine}</td><td style="${diff<14?'color:#e63946;font-weight:800':'color:#52b788;font-weight:800'}">${v.nextDue} (${diff}d)</td><td>${v.vet}</td></tr>`;}).join('')||'<tr><td colspan="4" style="text-align:center;color:#6b7280">No upcoming vaccinations</td></tr>';
  document.getElementById('vaccine-card').innerHTML=`<div class="card"><div class="card-heading">💉 Upcoming Vaccinations</div><div style="overflow-x:auto"><table class="data-table"><thead><tr><th>Cow</th><th>Vaccine</th><th>Due</th><th>Vet</th></tr></thead><tbody>${vacRows}</tbody></table></div><button class="btn-primary small" style="margin-top:16px" onclick="openModal('modal-add-vaccine')">+ Add Record</button></div>`;
}

function populateVacCowDropdown(){
  const el=document.getElementById('vac-cow-select');
  if(el)el.innerHTML=DB.get().cattle.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  const dt=document.getElementById('vac-date');if(dt&&!dt.value)dt.value=todayStr();
}

function addVaccination(){
  const cowId=document.getElementById('vac-cow-select').value;
  const vaccine=document.getElementById('vac-name').value;
  const date=document.getElementById('vac-date').value||todayStr();
  const nextDue=document.getElementById('vac-next').value;
  if(!nextDue){showToast('Enter next due date','error');return;}
  const d=DB.get();
  d.vaccinations.push({id:'VAC'+Date.now(),cowId,vaccine,date,nextDue,vet:document.getElementById('vac-vet').value,notes:document.getElementById('vac-notes').value});
  DB.save();closeAllModals();renderHealth();showToast('Vaccination saved ✓','success');
}
