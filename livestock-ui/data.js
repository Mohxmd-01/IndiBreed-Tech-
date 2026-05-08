/* ============================================================
   NiralFarm — Data Layer + LocalStorage Helpers  v4.0
   ============================================================ */
'use strict';
const NIRAL_KEY = 'niralFarmData_v4';

/* ── Milk log generator (30 days) ── */
function _genMilkLog() {
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
      log.push({id:`ML-${cId}-${dateStr}`,cowId:cId,date:dateStr,morning:m,evening:e,total:+(m+e).toFixed(1)});
    });
  }
  return log;
}

/* ── Seed Data ── */
const SEED_DATA = {
  farmer: {
    name:'Ramesh Patil', phone:'9876543210', village:'Takli',
    district:'Nashik', state:'Maharashtra', farmName:'Patil Dairy Farm',
    farmSize:'12', lang:'en', joinDate:'2024-01-15'
  },
  cattle: [
    {id:'COW001',name:'Lakshmi',breed:'Gir',age:5,weight:420,lactation:3,health:'healthy',pregnant:false,collarId:'SC-1001',tagId:'TAG-001',milkAvg:14,notes:'Best producer in herd',dob:'2021-03-10',color:'Brown'},
    {id:'COW002',name:'Ganga',breed:'HF Cross',age:4,weight:390,lactation:2,health:'warning',pregnant:true,collarId:'SC-1002',tagId:'TAG-002',milkAvg:11,notes:'Due for calving in 45 days',dob:'2022-05-22',color:'Black & White'},
    {id:'COW003',name:'Saraswati',breed:'Sahiwal',age:6,weight:400,lactation:4,health:'healthy',pregnant:false,collarId:'SC-1003',tagId:'TAG-003',milkAvg:10,notes:'',dob:'2020-07-15',color:'Red'},
    {id:'COW004',name:'Durga',breed:'Jersey Cross',age:3,weight:370,lactation:1,health:'critical',pregnant:false,collarId:'SC-1004',tagId:'TAG-004',milkAvg:8,notes:'Fever detected — vet visit scheduled',dob:'2023-01-08',color:'Fawn'},
    {id:'COW005',name:'Parvati',breed:'Murrah Buffalo',age:5,weight:440,lactation:3,health:'healthy',pregnant:false,collarId:null,tagId:'TAG-005',milkAvg:9,notes:'',dob:'2021-08-30',color:'Black'},
    {id:'COW006',name:'Kamala',breed:'Tharparkar',age:7,weight:410,lactation:4,health:'healthy',pregnant:false,collarId:'SC-1005',tagId:'TAG-006',milkAvg:12,notes:'',dob:'2019-11-20',color:'White'},
    {id:'COW007',name:'Radha',breed:'Rathi',age:4,weight:380,lactation:2,health:'warning',pregnant:true,collarId:null,tagId:'TAG-007',milkAvg:7,notes:'Heat cycle detected last week',dob:'2022-04-05',color:'Brown & White'},
    {id:'COW008',name:'Sita',breed:'Kankrej',age:2,weight:320,lactation:0,health:'healthy',pregnant:false,collarId:'SC-1006',tagId:'TAG-008',milkAvg:0,notes:'Heifer — first calving expected',dob:'2024-02-14',color:'Grey'}
  ],
  devices: [
    {id:'DEV001',collarId:'SC-1001',linkedCowId:'COW001',battery:87,signal:95,lastSync:Date.now()-120000,status:'online',firmware:'v2.3.1',temp:38.2,activity:72,lat:20.0121,lng:73.7898},
    {id:'DEV002',collarId:'SC-1002',linkedCowId:'COW002',battery:63,signal:82,lastSync:Date.now()-300000,status:'online',firmware:'v2.3.1',temp:38.8,activity:45,lat:20.0118,lng:73.7901},
    {id:'DEV003',collarId:'SC-1003',linkedCowId:'COW003',battery:42,signal:78,lastSync:Date.now()-600000,status:'online',firmware:'v2.2.8',temp:38.5,activity:61,lat:20.0125,lng:73.7894},
    {id:'DEV004',collarId:'SC-1004',linkedCowId:'COW004',battery:21,signal:45,lastSync:Date.now()-1800000,status:'online',firmware:'v2.3.1',temp:40.1,activity:20,lat:20.0119,lng:73.7905},
    {id:'DEV005',collarId:'SC-1005',linkedCowId:'COW006',battery:78,signal:91,lastSync:Date.now()-60000,status:'online',firmware:'v2.3.2',temp:38.3,activity:68,lat:20.0123,lng:73.7896},
    {id:'DEV006',collarId:'SC-1006',linkedCowId:'COW008',battery:95,signal:0,lastSync:Date.now()-86400000,status:'offline',firmware:'v2.3.2',temp:38.1,activity:0,lat:20.0120,lng:73.7900}
  ],
  milkLog: _genMilkLog(),
  alerts: [
    {id:'ALT001',type:'critical',cowId:'COW004',cowName:'Durga',title:'High Temperature Detected',desc:'Body temp 40.1°C — possible fever or infection. Immediate vet attention required.',time:Date.now()-3600000,resolved:false,action:'Call vet immediately'},
    {id:'ALT002',type:'warning',cowId:'COW002',cowName:'Ganga',title:'Calving Approaching — 45 Days',desc:'Prepare calving pen, colostrum supplies and inform your vet.',time:Date.now()-7200000,resolved:false,action:'Prepare calving area'},
    {id:'ALT003',type:'warning',cowId:'COW003',cowName:'Saraswati',title:'Low Battery — Collar SC-1003',desc:'Battery at 42%. Charge within 2 days to avoid data loss.',time:Date.now()-14400000,resolved:false,action:'Charge collar battery'},
    {id:'ALT004',type:'critical',cowId:'COW004',cowName:'Durga',title:'Critical Battery — Collar SC-1004',desc:'Battery at 21%. Device may go offline soon and stop tracking.',time:Date.now()-18000000,resolved:false,action:'Replace or charge collar'},
    {id:'ALT005',type:'info',cowId:'COW001',cowName:'Lakshmi',title:'Vaccination Due in 7 Days',desc:'FMD vaccination overdue. Schedule with Dr. Sharma immediately.',time:Date.now()-86400000,resolved:false,action:'Schedule vaccination'},
    {id:'ALT006',type:'warning',cowId:'COW007',cowName:'Radha',title:'Heat Cycle Detected',desc:'Standing heat observed. Optimal AI window: next 12–18 hours.',time:Date.now()-43200000,resolved:false,action:'Schedule artificial insemination'},
    {id:'ALT007',type:'info',cowId:'COW006',cowName:'Kamala',title:'Milk Yield Increased 15%',desc:'Yield up 15% this week. Continue current feed regimen.',time:Date.now()-172800000,resolved:true,action:''},
    {id:'ALT008',type:'warning',cowId:'COW008',cowName:'Sita',title:'Device Offline — SC-1006',desc:'SC-1006 has been offline for 24+ hours. Check collar connectivity.',time:Date.now()-90000000,resolved:false,action:'Check collar connection'}
  ],
  vaccinations: [
    {id:'VAC001',cowId:'COW001',vaccine:'FMD',date:'2026-02-15',nextDue:'2026-08-15',vet:'Dr. Sharma',notes:'Normal reaction'},
    {id:'VAC002',cowId:'COW001',vaccine:'HS',date:'2025-09-10',nextDue:'2026-09-10',vet:'Dr. Sharma',notes:''},
    {id:'VAC003',cowId:'COW002',vaccine:'BQ',date:'2026-01-20',nextDue:'2027-01-20',vet:'Dr. Patil',notes:''},
    {id:'VAC004',cowId:'COW003',vaccine:'FMD',date:'2026-03-01',nextDue:'2026-09-01',vet:'Dr. Sharma',notes:''},
    {id:'VAC005',cowId:'COW004',vaccine:'PPR',date:'2025-11-15',nextDue:'2026-11-15',vet:'Dr. Mehta',notes:'Mild fever post-vaccine'},
    {id:'VAC006',cowId:'COW005',vaccine:'FMD',date:'2026-02-28',nextDue:'2026-08-28',vet:'Dr. Sharma',notes:''},
    {id:'VAC007',cowId:'COW006',vaccine:'HS',date:'2026-01-05',nextDue:'2027-01-05',vet:'Dr. Patil',notes:''}
  ],
  reproductions: [
    {id:'REP001',cowId:'COW001',type:'AI',date:'2025-11-10',bull:'HF-Elite',success:true,notes:'Confirmed pregnant at 60 days'},
    {id:'REP002',cowId:'COW001',type:'calving',date:'2025-08-12',calf:'Female',calfWeight:28,notes:'Normal delivery, healthy calf'},
    {id:'REP003',cowId:'COW002',type:'AI',date:'2025-12-01',bull:'GIR-Supreme',success:true,notes:'Pregnant — calving expected May 2026'},
    {id:'REP004',cowId:'COW002',type:'calving',date:'2025-06-20',calf:'Male',calfWeight:26,notes:'Normal delivery'},
    {id:'REP005',cowId:'COW007',type:'heat',date:'2026-05-02',bull:'',success:false,notes:'Standing heat observed — AI window open now'},
    {id:'REP006',cowId:'COW003',type:'calving',date:'2025-03-15',calf:'Female',calfWeight:30,notes:''}
  ],
  healthHistory: [
    {id:'HH001',cowId:'COW004',date:'2026-05-03',issue:'Fever 40.1°C',treatment:'Antipyretic injection',vet:'Dr. Mehta',notes:'Follow-up in 2 days'},
    {id:'HH002',cowId:'COW002',date:'2026-04-20',issue:'Milk drop 20%',treatment:'Feed supplement added',vet:'Dr. Patil',notes:'Monitoring'},
    {id:'HH003',cowId:'COW001',date:'2026-03-10',issue:'Minor lameness',treatment:'Hoof trimming + zinc supplement',vet:'Dr. Sharma',notes:'Resolved'},
    {id:'HH004',cowId:'COW007',date:'2026-04-15',issue:'Heat cycle irregularity',treatment:'Hormone therapy',vet:'Dr. Patil',notes:'Next cycle expected in 21 days'}
  ],
  finance: {pricePerLitre:35, feedCostPerCowPerDay:180, otherCostPerDay:200}
};

/* ── DB Singleton ── */
const DB = (() => {
  let _d = null;
  const clone = o => JSON.parse(JSON.stringify(o));
  function load() {
    try { _d = JSON.parse(localStorage.getItem(NIRAL_KEY)) || clone(SEED_DATA); }
    catch { _d = clone(SEED_DATA); }
    // Ensure new fields exist on old saves
    if (!_d.healthHistory) _d.healthHistory = clone(SEED_DATA.healthHistory);
    return _d;
  }
  function save() { try { localStorage.setItem(NIRAL_KEY, JSON.stringify(_d)); } catch(e){} }
  function get() { return _d || load(); }
  function reset() { _d = clone(SEED_DATA); save(); return _d; }
  return {load, save, get, reset};
})();

/* ── i18n Strings ── */
const I18N = {
  en: {
    dashboard:'Dashboard', cattle:'Cattle', devices:'Smart Collars',
    milk:'Milk Tracking', alerts:'Alerts', health:'Health',
    finance:'Finance', advisory:'Advisory', profile:'Profile',
    addCattle:'+ Add Cattle', recordMilk:'+ Record Milk',
    totalCattle:'Total Cattle', healthy:'Healthy', todayMilk:"Today's Milk",
    activeAlerts:'Active Alerts', goodMorning:'Good Morning 🌄',
    goodAfternoon:'Good Afternoon ☀️', goodEvening:'Good Evening 🌙',
    farmDashboard:'Farm Dashboard', manageHerd:'Manage your herd',
    cattleMgmt:'Cattle Management', liveData:'Live Sensor Data',
    milkProd:'Milk Production', healthRec:'Health Records',
    vaccines:'Vaccines', reproduction:'Reproduction', location:'Location',
    online:'Online', offline:'Offline', battery:'Battery',
    signal:'Signal', lastSync:'Last Sync', revenue:'Revenue',
    profit:'Net Profit', cost:'Cost', language:'Language',
    save:'Save', cancel:'Cancel', delete:'Delete', edit:'Edit',
    logout:'Logout', back:'← Back to Herd'
  },
  hi: {
    dashboard:'डैशबोर्ड', cattle:'पशु', devices:'स्मार्ट कॉलर',
    milk:'दूध ट्रैकिंग', alerts:'अलर्ट', health:'स्वास्थ्य',
    finance:'वित्त', advisory:'सलाह', profile:'प्रोफाइल',
    addCattle:'+ पशु जोड़ें', recordMilk:'+ दूध दर्ज करें',
    totalCattle:'कुल पशु', healthy:'स्वस्थ', todayMilk:'आज का दूध',
    activeAlerts:'सक्रिय अलर्ट', goodMorning:'शुभ प्रभात 🌄',
    goodAfternoon:'नमस्कार ☀️', goodEvening:'शुभ संध्या 🌙',
    farmDashboard:'फार्म डैशबोर्ड', manageHerd:'अपने झुंड का प्रबंधन करें',
    cattleMgmt:'पशु प्रबंधन', liveData:'लाइव सेंसर डेटा',
    milkProd:'दूध उत्पादन', healthRec:'स्वास्थ्य रिकॉर्ड',
    vaccines:'टीके', reproduction:'प्रजनन', location:'स्थान',
    online:'ऑनलाइन', offline:'ऑफलाइन', battery:'बैटरी',
    signal:'सिग्नल', lastSync:'अंतिम सिंक', revenue:'आय',
    profit:'शुद्ध लाभ', cost:'लागत', language:'भाषा',
    save:'सहेजें', cancel:'रद्द करें', delete:'हटाएं', edit:'संपादित करें',
    logout:'लॉगआउट', back:'← झुंड पर वापस'
  },
  mr: {
    dashboard:'डॅशबोर्ड', cattle:'जनावरे', devices:'स्मार्ट कॉलर',
    milk:'दूध ट्रॅकिंग', alerts:'सूचना', health:'आरोग्य',
    finance:'आर्थिक', advisory:'सल्ला', profile:'प्रोफाइल',
    addCattle:'+ जनावर जोडा', recordMilk:'+ दूध नोंदवा',
    totalCattle:'एकूण जनावरे', healthy:'निरोगी', todayMilk:'आजचे दूध',
    activeAlerts:'सक्रिय सूचना', goodMorning:'शुभ प्रभात 🌄',
    goodAfternoon:'नमस्कार ☀️', goodEvening:'शुभ संध्याकाळ 🌙',
    farmDashboard:'शेत डॅशबोर्ड', manageHerd:'आपल्या कळपाचे व्यवस्थापन',
    cattleMgmt:'जनावर व्यवस्थापन', liveData:'थेट सेन्सर डेटा',
    milkProd:'दूध उत्पादन', healthRec:'आरोग्य नोंदी',
    vaccines:'लसीकरण', reproduction:'प्रजनन', location:'स्थान',
    online:'ऑनलाइन', offline:'ऑफलाइन', battery:'बॅटरी',
    signal:'सिग्नल', lastSync:'शेवटची सिंक', revenue:'उत्पन्न',
    profit:'निव्वळ नफा', cost:'खर्च', language:'भाषा',
    save:'जतन करा', cancel:'रद्द करा', delete:'हटवा', edit:'संपादित करा',
    logout:'लॉगआउट', back:'← कळपावर परत'
  }
};
