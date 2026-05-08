// NiralFarm — Seed Data & DB  v5.0
function genMilkLog() {
  const log = [];
  const cows = ['COW001','COW002','COW003','COW004','COW005','COW006','COW007'];
  const avgs = {COW001:14,COW002:11,COW003:10,COW004:8,COW005:9,COW006:12,COW007:7};
  const now = Date.now();
  for (let d = 29; d >= 0; d--) {
    const ts = now - d * 86400000;
    const dateStr = new Date(ts).toISOString().split('T')[0];
    cows.forEach(cId => {
      const avg = avgs[cId] || 0;
      const m = Math.max(0, +(avg * 0.6 + (Math.random()-0.5)*2).toFixed(1));
      const e = Math.max(0, +(avg * 0.4 + (Math.random()-0.5)*1.5).toFixed(1));
      log.push({ id:`ML-${cId}-${dateStr}`, cowId:cId, date:dateStr, morning:m, evening:e, total:+(m+e).toFixed(1) });
    });
  }
  return log;
}

export const SEED = {
  farmer: { name:'Ramesh Patil', phone:'9876543210', village:'Takli', district:'Nashik', state:'Maharashtra', farmName:'Patil Dairy Farm', farmSize:'12', lang:'en', joinDate:'2024-01-15' },
  cattle: [
    { id:'COW001', name:'Lakshmi',    breed:'Gir',           age:5, weight:420, lactation:3, health:'healthy',  pregnant:false, collarId:'SC-1001', tagId:'TAG-001', milkAvg:14, notes:'Best producer in herd' },
    { id:'COW002', name:'Ganga',      breed:'HF Cross',      age:4, weight:390, lactation:2, health:'warning',  pregnant:true,  collarId:'SC-1002', tagId:'TAG-002', milkAvg:11, notes:'Due for calving in 45 days' },
    { id:'COW003', name:'Saraswati',  breed:'Sahiwal',       age:6, weight:400, lactation:4, health:'healthy',  pregnant:false, collarId:'SC-1003', tagId:'TAG-003', milkAvg:10, notes:'' },
    { id:'COW004', name:'Durga',      breed:'Jersey Cross',  age:3, weight:370, lactation:1, health:'critical', pregnant:false, collarId:'SC-1004', tagId:'TAG-004', milkAvg:8,  notes:'Fever detected — vet visit scheduled' },
    { id:'COW005', name:'Parvati',    breed:'Murrah Buffalo',age:5, weight:440, lactation:3, health:'healthy',  pregnant:false, collarId:null,      tagId:'TAG-005', milkAvg:9,  notes:'' },
    { id:'COW006', name:'Kamala',     breed:'Tharparkar',    age:7, weight:410, lactation:4, health:'healthy',  pregnant:false, collarId:'SC-1005', tagId:'TAG-006', milkAvg:12, notes:'' },
    { id:'COW007', name:'Radha',      breed:'Rathi',         age:4, weight:380, lactation:2, health:'warning',  pregnant:true,  collarId:null,      tagId:'TAG-007', milkAvg:7,  notes:'Heat cycle detected last week' },
    { id:'COW008', name:'Sita',       breed:'Kankrej',       age:2, weight:320, lactation:0, health:'healthy',  pregnant:false, collarId:'SC-1006', tagId:'TAG-008', milkAvg:0,  notes:'Heifer — first calving expected' },
  ],
  devices: [
    { id:'DEV001', collarId:'SC-1001', linkedCowId:'COW001', battery:87, signal:95, lastSync:Date.now()-120000,   status:'online',  firmware:'v2.3.1', temp:38.2, activity:72 },
    { id:'DEV002', collarId:'SC-1002', linkedCowId:'COW002', battery:63, signal:82, lastSync:Date.now()-300000,   status:'online',  firmware:'v2.3.1', temp:38.8, activity:45 },
    { id:'DEV003', collarId:'SC-1003', linkedCowId:'COW003', battery:42, signal:78, lastSync:Date.now()-600000,   status:'online',  firmware:'v2.2.8', temp:38.5, activity:61 },
    { id:'DEV004', collarId:'SC-1004', linkedCowId:'COW004', battery:21, signal:45, lastSync:Date.now()-1800000,  status:'online',  firmware:'v2.3.1', temp:40.1, activity:20 },
    { id:'DEV005', collarId:'SC-1005', linkedCowId:'COW006', battery:78, signal:91, lastSync:Date.now()-60000,    status:'online',  firmware:'v2.3.2', temp:38.3, activity:68 },
    { id:'DEV006', collarId:'SC-1006', linkedCowId:'COW008', battery:95, signal:0,  lastSync:Date.now()-86400000, status:'offline', firmware:'v2.3.2', temp:38.1, activity:0  },
  ],
  milkLog: genMilkLog(),
  alerts: [
    { id:'ALT001', type:'critical', cowId:'COW004', cowName:'Durga',     title:'High Temperature Detected',      desc:'Body temp 40.1°C — possible fever.', time:Date.now()-3600000,   resolved:false, action:'Call vet immediately' },
    { id:'ALT002', type:'warning',  cowId:'COW002', cowName:'Ganga',     title:'Calving Approaching — 45 Days',  desc:'Prepare calving pen and supplies.',  time:Date.now()-7200000,   resolved:false, action:'Prepare calving area' },
    { id:'ALT003', type:'warning',  cowId:'COW003', cowName:'Saraswati', title:'Low Battery — SC-1003',          desc:'Battery at 42%. Charge soon.',      time:Date.now()-14400000,  resolved:false, action:'Charge collar battery' },
    { id:'ALT004', type:'critical', cowId:'COW004', cowName:'Durga',     title:'Critical Battery — SC-1004',     desc:'Battery at 21%. May go offline.',   time:Date.now()-18000000,  resolved:false, action:'Replace or charge collar' },
    { id:'ALT005', type:'info',     cowId:'COW001', cowName:'Lakshmi',   title:'Vaccination Due in 7 Days',      desc:'FMD vaccination overdue.',          time:Date.now()-86400000,  resolved:false, action:'Schedule vaccination' },
    { id:'ALT006', type:'warning',  cowId:'COW007', cowName:'Radha',     title:'Heat Cycle Detected',            desc:'Optimal AI window: 12–18 hours.',  time:Date.now()-43200000,  resolved:false, action:'Schedule AI' },
    { id:'ALT007', type:'info',     cowId:'COW006', cowName:'Kamala',    title:'Milk Yield Increased 15%',       desc:'Yield up 15% this week.',           time:Date.now()-172800000, resolved:true,  action:'' },
    { id:'ALT008', type:'warning',  cowId:'COW008', cowName:'Sita',      title:'Device Offline — SC-1006',       desc:'SC-1006 offline for 24+ hours.',   time:Date.now()-90000000,  resolved:false, action:'Check collar' },
  ],
  vaccinations: [
    { id:'VAC001', cowId:'COW001', vaccine:'FMD',       date:'2026-02-15', nextDue:'2026-08-15', vet:'Dr. Sharma', notes:'Normal reaction' },
    { id:'VAC002', cowId:'COW001', vaccine:'HS',        date:'2025-09-10', nextDue:'2026-09-10', vet:'Dr. Sharma', notes:'' },
    { id:'VAC003', cowId:'COW002', vaccine:'BQ',        date:'2026-01-20', nextDue:'2027-01-20', vet:'Dr. Patil',  notes:'' },
    { id:'VAC004', cowId:'COW003', vaccine:'FMD',       date:'2026-03-01', nextDue:'2026-09-01', vet:'Dr. Sharma', notes:'' },
    { id:'VAC005', cowId:'COW004', vaccine:'PPR',       date:'2025-11-15', nextDue:'2026-11-15', vet:'Dr. Mehta',  notes:'Mild fever post-vaccine' },
    { id:'VAC006', cowId:'COW005', vaccine:'FMD',       date:'2026-02-28', nextDue:'2026-08-28', vet:'Dr. Sharma', notes:'' },
    { id:'VAC007', cowId:'COW006', vaccine:'HS',        date:'2026-01-05', nextDue:'2027-01-05', vet:'Dr. Patil',  notes:'' },
  ],
  reproductions: [
    { id:'REP001', cowId:'COW001', type:'AI',      date:'2025-11-10', bull:'HF-Elite',    success:true,  notes:'Confirmed pregnant at 60 days' },
    { id:'REP002', cowId:'COW001', type:'calving', date:'2025-08-12', calf:'Female',      calfWeight:28, notes:'Normal delivery, healthy calf' },
    { id:'REP003', cowId:'COW002', type:'AI',      date:'2025-12-01', bull:'GIR-Supreme', success:true,  notes:'Pregnant — calving expected May 2026' },
    { id:'REP005', cowId:'COW007', type:'heat',    date:'2026-05-02', bull:'',            success:false, notes:'Standing heat — AI window open now' },
  ],
  healthHistory: [
    { id:'HH001', cowId:'COW004', date:'2026-05-03', issue:'Fever 40.1°C',       treatment:'Antipyretic injection', vet:'Dr. Mehta',  notes:'Follow-up in 2 days' },
    { id:'HH002', cowId:'COW002', date:'2026-04-20', issue:'Milk drop 20%',      treatment:'Feed supplement added', vet:'Dr. Patil',  notes:'Monitoring' },
    { id:'HH003', cowId:'COW001', date:'2026-03-10', issue:'Minor lameness',     treatment:'Hoof trimming',         vet:'Dr. Sharma', notes:'Resolved' },
    { id:'HH004', cowId:'COW007', date:'2026-04-15', issue:'Heat irregularity',  treatment:'Hormone therapy',       vet:'Dr. Patil',  notes:'Next cycle in 21 days' },
  ],
  finance: { pricePerLitre:35, feedCostPerCowPerDay:180, otherCostPerDay:200 },
};

const KEY = 'niralFarm_v5';
export const DB = {
  load: () => { try { return JSON.parse(localStorage.getItem(KEY)) || SEED; } catch { return SEED; } },
  save: (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch {} },
  reset: () => { localStorage.removeItem(KEY); return SEED; },
};

export const todayStr = () => new Date().toISOString().split('T')[0];
export const timeAgo = (ts) => {
  const d = Date.now() - ts;
  if (d < 60000) return 'Just now';
  if (d < 3600000) return Math.floor(d/60000) + 'm ago';
  if (d < 86400000) return Math.floor(d/3600000) + 'h ago';
  return Math.floor(d/86400000) + 'd ago';
};
export const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN');
export const lactLabel = (n) => ['Dry','1st Lac','2nd Lac','3rd Lac','4th+ Lac'][n] || 'Dry';
