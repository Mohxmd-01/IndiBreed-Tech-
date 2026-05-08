'use strict';
/* NiralFarm — Cattle Module v4.0 */

function renderCattleGrid() {
  const d = DB.get();
  const q = (document.getElementById('cattle-search') || {}).value || '';
  const f = APP.cattleFilter;
  const today = todayStr();
  let list = d.cattle.filter(c => {
    const matchQ = !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.breed.toLowerCase().includes(q.toLowerCase()) || c.tagId.toLowerCase().includes(q.toLowerCase());
    const matchF = f === 'all' || (f === 'pregnant' ? c.pregnant : c.health === f);
    return matchQ && matchF;
  });
  const grid = document.getElementById('cattle-grid');
  if (!grid) return;
  if (!list.length) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#6b7280">No cattle found</div>'; return; }
  grid.innerHTML = list.map(c => {
    const milk = d.milkLog.filter(m => m.date === today && m.cowId === c.id).reduce((s, m) => s + m.total, 0).toFixed(1);
    const dev = d.devices.find(dv => dv.linkedCowId === c.id);
    return `<div class="cattle-card ${c.health}" onclick="openCowDetail('${c.id}')">
      <div class="cattle-top">
        <div><div class="cattle-name">${c.pregnant ? '🤰 ' : ''}${c.name}</div><div class="cattle-id">${c.tagId}</div></div>
        <div class="status-dot ${c.health}"></div>
      </div>
      <div class="cattle-info">
        <span class="info-tag">🐮 ${c.breed}</span>
        <span class="info-tag">📅 ${c.age}yr</span>
        <span class="info-tag">🥛 ${lactLabel(c.lactation)}</span>
        ${dev ? `<span class="info-tag" style="color:${dev.status==='online'?'#2d6a4f':'#e63946'}">📡 ${dev.status}</span>` : ''}
      </div>
      <div class="cattle-milk">${milk}L <span>today</span></div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn-outline small" style="flex:1" onclick="event.stopPropagation();openEditCattle('${c.id}')">✏️ Edit</button>
        <button class="btn-del small" onclick="event.stopPropagation();deleteCattle('${c.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function addCattle() {
  const name = document.getElementById('add-name').value.trim();
  if (!name) { showToast('Name is required', 'error'); return; }
  const d = DB.get();
  const id = 'COW' + String(Date.now()).slice(-6);
  d.cattle.push({
    id, name,
    tagId: document.getElementById('add-tagid').value || 'TAG-' + id.slice(-3),
    breed: document.getElementById('add-breed').value,
    age: +document.getElementById('add-age').value || 3,
    weight: +document.getElementById('add-weight').value || 350,
    lactation: +document.getElementById('add-lactation').value,
    health: document.getElementById('add-health').value,
    pregnant: document.getElementById('preg-yes').classList.contains('active'),
    collarId: null, milkAvg: 0,
    notes: document.getElementById('add-notes').value,
    dob: '', color: ''
  });
  DB.save(); closeAllModals(); renderCattleGrid(); renderDashboard();
  showToast(name + ' added successfully 🐄', 'success');
  ['add-name','add-tagid','add-age','add-weight','add-notes'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
}

function openEditCattle(id) {
  const d = DB.get();
  const c = d.cattle.find(x => x.id === id);
  if (!c) return;
  document.getElementById('edit-cattle-id').value = id;
  document.getElementById('edit-name').value = c.name;
  document.getElementById('edit-tagid').value = c.tagId;
  document.getElementById('edit-breed').value = c.breed;
  document.getElementById('edit-age').value = c.age;
  document.getElementById('edit-weight').value = c.weight;
  document.getElementById('edit-lactation').value = c.lactation;
  document.getElementById('edit-health').value = c.health;
  if (c.pregnant) { setToggle('epreg-yes','epreg-no'); } else { setToggle('epreg-no','epreg-yes'); }
  document.getElementById('edit-notes').value = c.notes || '';
  openModal('modal-edit-cattle');
}

function saveEditCattle() {
  const id = document.getElementById('edit-cattle-id').value;
  const d = DB.get();
  const c = d.cattle.find(x => x.id === id);
  if (!c) return;
  c.name = document.getElementById('edit-name').value.trim() || c.name;
  c.tagId = document.getElementById('edit-tagid').value;
  c.breed = document.getElementById('edit-breed').value;
  c.age = +document.getElementById('edit-age').value || c.age;
  c.weight = +document.getElementById('edit-weight').value || c.weight;
  c.lactation = +document.getElementById('edit-lactation').value;
  c.health = document.getElementById('edit-health').value;
  c.pregnant = document.getElementById('epreg-yes').classList.contains('active');
  c.notes = document.getElementById('edit-notes').value;
  DB.save(); closeAllModals(); renderCattleGrid(); renderDashboard();
  showToast(c.name + ' updated ✓', 'success');
}

function deleteCattle(id) {
  const d = DB.get();
  const c = d.cattle.find(x => x.id === id);
  if (!c || !confirm('Delete ' + c.name + '? This cannot be undone.')) return;
  d.cattle = d.cattle.filter(x => x.id !== id);
  d.devices.forEach(dv => { if (dv.linkedCowId === id) dv.linkedCowId = null; });
  DB.save(); renderCattleGrid(); renderDashboard();
  showToast(c.name + ' removed', 'warning');
}
