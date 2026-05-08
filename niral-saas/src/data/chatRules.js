// Rule-based chatbot knowledge base — EN / HI / MR
export const CHAT_RULES = [
  {
    patterns: ['temperature', 'fever', 'temp', 'hot', 'तापमान', 'बुखार', 'ताप'],
    answer: {
      en: '🌡️ **High Temperature Alert**\nNormal range: 38–39.5°C. If above 40°C:\n• Isolate the cow immediately\n• Provide cool water and shade\n• Call your vet for antipyretics\n• Check for mastitis or respiratory infection',
      hi: '🌡️ **उच्च तापमान सूचना**\nसामान्य सीमा: 38–39.5°C. 40°C से ऊपर होने पर:\n• गाय को तुरंत अलग करें\n• ठंडा पानी और छाया दें\n• पशु चिकित्सक को बुलाएं\n• मास्टिटिस की जांच करें',
      mr: '🌡️ **उच्च तापमान सूचना**\nसामान्य श्रेणी: 38–39.5°C. 40°C वर असल्यास:\n• गाय लगेच वेगळी करा\n• थंड पाणी आणि सावली द्या\n• पशुवैद्याला बोलवा\n• मास्टिटिसची तपासणी करा',
    },
  },
  {
    patterns: ['milk drop', 'milk decrease', 'less milk', 'दूध कम', 'दूध घट', 'दुग्धघट'],
    answer: {
      en: '🥛 **Milk Drop Solutions**\n• Check feed quantity and quality\n• Add mineral mixture to diet\n• Ensure 8–10 hrs of quality roughage\n• Rule out mastitis (check for lumps)\n• Reduce stress — check for illness\n• Keep milking schedule consistent',
      hi: '🥛 **दूध कम होने के समाधान**\n• चारे की मात्रा और गुणवत्ता जांचें\n• खनिज मिश्रण आहार में जोड़ें\n• 8-10 घंटे अच्छा चारा सुनिश्चित करें\n• मास्टिटिस की जांच करें\n• तनाव कम करें\n• दुहने का समय नियमित रखें',
      mr: '🥛 **दूध घटण्याचे उपाय**\n• चाऱ्याचे प्रमाण आणि गुणवत्ता तपासा\n• खनिज मिश्रण आहारात जोडा\n• 8-10 तास चांगले चारे द्या\n• मास्टिटिसची तपासणी करा\n• तणाव कमी करा\n• दुधाचे वेळापत्रक नियमित ठेवा',
    },
  },
  {
    patterns: ['vaccination', 'vaccine', 'टीका', 'लस', 'वैक्सीन'],
    answer: {
      en: '💉 **Vaccination Schedule (Cattle)**\n• FMD: Every 6 months\n• HS (Hemorrhagic Septicemia): Annually before monsoon\n• BQ (Black Quarter): Annually\n• PPR: Annually (small ruminants)\n• Brucellosis: Once (heifers 4–8 months)\n\nAlways consult your vet for exact dates.',
      hi: '💉 **टीकाकरण अनुसूची (पशु)**\n• FMD: हर 6 महीने\n• HS: मानसून से पहले वार्षिक\n• BQ: वार्षिक\n• PPR: वार्षिक\n• ब्रुसेलोसिस: एक बार (4-8 महीने)\n\nसटीक तारीखों के लिए पशु चिकित्सक से मिलें।',
      mr: '💉 **लसीकरण वेळापत्रक (पशू)**\n• FMD: दर 6 महिन्यांनी\n• HS: पावसाळ्यापूर्वी वार्षिक\n• BQ: वार्षिक\n• PPR: वार्षिक\n• ब्रुसेलोसिस: एकदा (4-8 महिने)\n\nअचूक तारखांसाठी पशुवैद्याला भेटा.',
    },
  },
  {
    patterns: ['calving', 'pregnant', 'delivery', 'ब्याना', 'गर्भवती', 'व्याणे'],
    answer: {
      en: '🐄 **Calving Preparation Guide**\n• Prepare clean, dry calving pen (10x12 ft)\n• Stock: rope, iodine, towels, colostrum\n• Signs: swelling of vulva, milk in udder, restlessness\n• Allow natural delivery; assist if >2hrs no progress\n• Colostrum within 2 hours of birth is critical\n• Weigh calf and record birth details',
      hi: '🐄 **ब्याने की तैयारी**\n• साफ, सूखी जगह तैयार करें\n• रस्सी, आयोडीन, तौलिए, खीस रखें\n• संकेत: योनि में सूजन, बेचैनी\n• 2 घंटे में प्रगति न हो तो मदद करें\n• जन्म के 2 घंटे में खीस जरूरी है\n• बछड़े का वजन और विवरण दर्ज करें',
      mr: '🐄 **व्याण्याची तयारी**\n• स्वच्छ, कोरडी जागा तयार करा\n• दोरी, आयोडीन, टॉवेल, चीक ठेवा\n• चिन्हे: योनीला सूज, बेचैनी\n• 2 तासांत प्रगती नाही तर मदत करा\n• जन्माच्या 2 तासांत चीक महत्त्वाचे\n• वासराचे वजन आणि तपशील नोंदवा',
    },
  },
  {
    patterns: ['feed', 'diet', 'nutrition', 'fodder', 'चारा', 'आहार', 'खुराक'],
    answer: {
      en: '🌾 **Feeding Guide for Dairy Cows**\n• Dry matter: 2–2.5% of body weight\n• Ratio: 60% roughage + 40% concentrate\n• High producers need bypass protein\n• Add mineral mix: 50g/day\n• Fresh clean water always available\n• Total Mixed Ration (TMR) is most efficient\n• Avoid sudden feed changes',
      hi: '🌾 **डेयरी गायों के लिए आहार मार्गदर्शिका**\n• शुष्क पदार्थ: शरीर के वजन का 2-2.5%\n• अनुपात: 60% चारा + 40% दाना\n• अधिक उत्पादन के लिए बाईपास प्रोटीन\n• खनिज मिश्रण: 50 ग्राम/दिन\n• हमेशा ताजा साफ पानी\n• अचानक बदलाव से बचें',
      mr: '🌾 **दुग्धगायींसाठी आहार मार्गदर्शन**\n• कोरडे पदार्थ: शरीराच्या वजनाच्या 2-2.5%\n• गुणोत्तर: 60% चारा + 40% खुराक\n• जास्त उत्पादनासाठी बायपास प्रोटीन\n• खनिज मिश्रण: 50 ग्रॅम/दिवस\n• नेहमी ताजे स्वच्छ पाणी\n• अचानक बदल टाळा',
    },
  },
  {
    patterns: ['mastitis', 'udder',', थनेला', 'कास रोग', 'आंचळ'],
    answer: {
      en: '🩺 **Mastitis Detection & Treatment**\n• Signs: swollen/hard udder, clots in milk, pain\n• Test: California Mastitis Test (CMT)\n• Treatment: antibiotic therapy by vet\n• Mild cases: frequent milking, warm compress\n• Prevention: clean milking, teat dipping, dry cow therapy\n• Discard milk during treatment',
      hi: '🩺 **थनेला (मास्टिटिस)**\n• लक्षण: थन में सूजन, दूध में गुठलियाँ, दर्द\n• टेस्ट: कैलिफोर्निया मास्टिटिस टेस्ट\n• उपचार: पशु चिकित्सक से एंटीबायोटिक\n• हल्के मामले: बार-बार दुहना, गर्म सेंक\n• रोकथाम: स्वच्छ दुहान, निप्पल डिपिंग\n• उपचार के दौरान दूध फेंकें',
      mr: '🩺 **कास रोग (मास्टिटिस)**\n• चिन्हे: आंचळ सुजणे, दुधात गुठळ्या, वेदना\n• चाचणी: कॅलिफोर्निया मास्टिटिस चाचणी\n• उपचार: पशुवैद्याकडून प्रतिजैविक\n• सौम्य: वारंवार दूध काढणे, उष्ण शेक\n• प्रतिबंध: स्वच्छ दुभणे, टीट डिपिंग\n• उपचारादरम्यान दूध फेकून द्या',
    },
  },
  {
    patterns: ['heat', 'estrus', 'ai', 'artificial insemination', 'माज', 'गर्मी', 'रेतन'],
    answer: {
      en: '🔥 **Heat Detection & AI Guide**\n• Signs: restlessness, mounting behavior, clear discharge, reduced milk\n• Duration: 12–18 hours (best AI window: 6–12h after onset)\n• Best time for AI: morning observation → afternoon AI\n• Wait 21 days to confirm heat cycle\n• Confirm pregnancy at 60 days post-AI\n• Keep breeding records updated',
      hi: '🔥 **माज और कृत्रिम गर्भाधान**\n• लक्षण: बेचैनी, चढ़ना, साफ स्राव, कम दूध\n• अवधि: 12-18 घंटे (सर्वोत्तम: 6-12 घंटे बाद)\n• सुबह देखें → दोपहर में रेतन\n• 21 दिन बाद माज की पुष्टि करें\n• रेतन के 60 दिन बाद गर्भ की जांच\n• प्रजनन रिकॉर्ड अपडेट रखें',
      mr: '🔥 **माज आणि कृत्रिम रेतन**\n• चिन्हे: बेचैनी, चढणे, स्वच्छ स्राव, कमी दूध\n• कालावधी: 12-18 तास (सर्वोत्तम: 6-12 तासांनंतर)\n• सकाळी निरीक्षण → दुपारी रेतन\n• 21 दिवसांनी माजाची खात्री करा\n• रेतनानंतर 60 दिवसांनी गर्भ तपासा\n• प्रजनन नोंदी अद्ययावत ठेवा',
    },
  },
  {
    patterns: ['activity low', 'lazy', 'not moving', 'lethargic', 'सुस्त', 'निष्क्रिय', 'आळशी'],
    answer: {
      en: '😴 **Low Activity Warning**\nLow activity may indicate:\n• Early stage illness or pain\n• Nutritional deficiency (calcium/phosphorus)\n• Hoof problems or lameness\n• Postpartum issues\n\nAction: Check temperature, inspect hooves, ensure mineral intake. Call vet if activity below 20% for 2+ days.',
      hi: '😴 **कम गतिविधि चेतावनी**\nकम गतिविधि संकेत दे सकती है:\n• बीमारी या दर्द\n• पोषण की कमी (कैल्शियम/फॉस्फोरस)\n• खुर की समस्या\n• प्रसव के बाद की समस्याएं\n\nकार्रवाई: तापमान जांचें, खुर देखें, खनिज सुनिश्चित करें।',
      mr: '😴 **कमी क्रियाकलाप इशारा**\nकमी क्रियाकलाप दर्शवू शकतो:\n• आजारपण किंवा वेदना\n• पोषणाची कमतरता\n• खुराची समस्या\n• प्रसूतीनंतरची समस्या\n\nकृती: तापमान तपासा, खूर पाहा, खनिजे सुनिश्चित करा।',
    },
  },
  {
    patterns: ['collar', 'device', 'sensor', 'battery', 'कॉलर', 'डिवाइस', 'बैटरी'],
    answer: {
      en: '📡 **Smart Collar Guide**\n• Charge when battery below 30%\n• Clean collar weekly with damp cloth\n• Check signal strength daily\n• If offline: check proximity to router\n• Normal temp range: 38–39.5°C\n• Activity >60% = good health indicator\n• Sync data at least twice daily',
      hi: '📡 **स्मार्ट कॉलर गाइड**\n• 30% से कम बैटरी होने पर चार्ज करें\n• साप्ताहिक गीले कपड़े से साफ करें\n• दैनिक सिग्नल जांचें\n• ऑफलाइन: राउटर की जांच करें\n• सामान्य तापमान: 38-39.5°C',
      mr: '📡 **स्मार्ट कॉलर मार्गदर्शन**\n• 30% पेक्षा कमी बॅटरीवर चार्ज करा\n• साप्ताहिक ओल्या कपड्याने साफ करा\n• दैनिक सिग्नल तपासा\n• ऑफलाइन: राउटर तपासा\n• सामान्य तापमान: 38-39.5°C',
    },
  },
  {
    patterns: ['gir', 'breed', 'sahiwal', 'hf', 'jersey', 'नस्ल', 'जात'],
    answer: {
      en: '🐄 **Breed Information**\n• **Gir**: 8–12L/day, heat tolerant, A2 milk, best for Maharashtra\n• **HF Cross**: 15–25L/day, needs good management, cold tolerant\n• **Sahiwal**: 10–15L/day, disease resistant, tick tolerant\n• **Jersey Cross**: 12–20L/day, high fat%, good in humid areas\n• **Murrah Buffalo**: 12–20L/day, high fat milk',
      hi: '🐄 **नस्ल जानकारी**\n• **गिर**: 8-12L/दिन, गर्मी सहनशील, A2 दूध\n• **HF क्रॉस**: 15-25L/दिन, अच्छे प्रबंधन की जरूरत\n• **साहीवाल**: 10-15L/दिन, रोग प्रतिरोधी\n• **जर्सी क्रॉस**: 12-20L/दिन, उच्च वसा%\n• **मुर्रा भैंस**: 12-20L/दिन, उच्च वसा दूध',
      mr: '🐄 **जात माहिती**\n• **गीर**: 8-12L/दिवस, उष्णता सहनशील, A2 दूध\n• **HF क्रॉस**: 15-25L/दिवस, चांगले व्यवस्थापन आवश्यक\n• **साहिवाल**: 10-15L/दिवस, रोग प्रतिरोधक\n• **जर्सी क्रॉस**: 12-20L/दिवस, उच्च फॅट%\n• **मुर्रा म्हैस**: 12-20L/दिवस, उच्च फॅट दूध',
    },
  },
  {
    patterns: ['disease', 'sick', 'illness', 'fmd', 'foot', 'mouth', 'hs', 'hemorrhagic', 'bimari', 'बीमारी', 'आजार'],
    answer: {
      en: '🦠 **Disease Prevention Guide**\n• **FMD**: Vaccinate every 6 months. Keep new animals quarantined 21 days.\n• **HS**: Annual vaccine before monsoon. Avoid waterlogged areas.\n• **BQ**: Annual vaccine for young stock. Avoid low-lying marshy fields.\n• **Mastitis**: Use post-milking teat dip. Clean milking equipment daily.\n• **Worms**: Deworm every 3–4 months. Rotate pastures.',
      hi: '🦠 **रोग निवारण मार्गदर्शिका**\n• **FMD**: हर 6 महीने टीका। नए पशु 21 दिन अलग रखें।\n• **HS**: मानसून से पहले वार्षिक टीका।\n• **BQ**: युवा पशुओं के लिए वार्षिक टीका।\n• **मास्टिटिस**: दुहने के बाद निप्पल डिपिंग करें।\n• **कृमि**: हर 3–4 महीने में कृमिनाशक दें।',
      mr: '🦠 **रोग प्रतिबंध मार्गदर्शन**\n• **FMD**: दर 6 महिन्यांनी लस. नवीन पशू 21 दिवस वेगळे ठेवा.\n• **HS**: पावसाळ्यापूर्वी वार्षिक लस.\n• **BQ**: तरुण पशूंसाठी वार्षिक लस.\n• **मास्टिटिस**: दूध काढल्यानंतर टीट डिप.\n• **जंत**: दर 3–4 महिन्यांनी जंतनाशक द्या.',
    },
  },
  {
    patterns: ['profit', 'income', 'revenue', 'money', 'sell milk', 'price', 'कमाई', 'लाभ', 'नफा'],
    answer: {
      en: '💰 **Dairy Profitability Tips**\n• Sell directly to cooperatives (AMUL/Mahanand) for better rates\n• Morning milk has higher fat — price it accordingly\n• Produce A2 milk (Gir/Sahiwal) for premium pricing ₹60–80/L\n• Track feed costs daily — target feed cost <40% of revenue\n• Apply for PM Kisan, NABARD dairy loans at 3–5% interest\n• Value-add: make ghee or curd for 3× profit margins',
      hi: '💰 **डेयरी लाभप्रदता सुझाव**\n• सहकारी (AMUL/Mahanand) को सीधे बेचें\n• A2 दूध (गिर/साहीवाल) ₹60–80/ली प्रीमियम पाएं\n• चारा लागत आय का <40% रखें\n• PM किसान, NABARD डेयरी ऋण 3–5% ब्याज पर\n• घी/दही बनाएं — 3× अधिक लाभ',
      mr: '💰 **दुग्ध व्यवसाय नफा टिप्स**\n• सहकारी (AMUL/Mahanand) ला थेट विका\n• A2 दूध (गीर/साहिवाल) ₹60–80/ली प्रीमियम\n• चारा खर्च उत्पन्नाच्या <40% ठेवा\n• PM किसान, NABARD दुग्ध कर्ज 3–5%\n• तूप/दही बनवा — 3× जास्त नफा',
    },
  },
  {
    patterns: ['monsoon', 'rain', 'rainy', 'flood', 'hoof rot', 'पावसाळा', 'बारिश', 'पाऊस'],
    answer: {
      en: '🌧️ **Monsoon Cattle Care**\n• Vaccinate against FMD and HS before June\n• Deworm entire herd — worm load increases in rains\n• Keep shed floors dry — hoof rot risk is high\n• Check for ticks and lice — use pour-on acaricide\n• Avoid waterlogged grazing areas\n• Add extra vitamin supplement to feed\n• Ensure proper drainage around sheds',
      hi: '🌧️ **मानसून पशु देखभाल**\n• जून से पहले FMD और HS का टीका लगाएं\n• पूरे झुंड को कृमिनाशक दें\n• बाड़े की फर्श सूखी रखें — खुर सड़न का खतरा\n• टिक्स और जूं के लिए एकेरिसाइड\n• जलभराव वाले चारागाह से बचें\n• आहार में विटामिन जोड़ें',
      mr: '🌧️ **पावसाळ्यात पशू काळजी**\n• जूनपूर्वी FMD आणि HS लस द्या\n• संपूर्ण कळपाला जंतनाशक द्या\n• गोठ्याचा मजला कोरडा ठेवा — खूर सड धोका\n• टिक आणि उवांसाठी ॲकेरिसाइड वापरा\n• जलमय चराऊ जागा टाळा\n• आहारात जीवनसत्त्वे जोडा',
    },
  },
  {
    patterns: ['milk quality', 'fat', 'snf', 'adulteration', 'clr', 'दूध गुणवत्ता', 'वसा', 'दुधाचा दर्जा'],
    answer: {
      en: '🥛 **Milk Quality Improvement**\n• **Fat%**: Feed bypass fat, green fodder, cottonseed\n• **SNF%**: Ensure 16% protein in concentrate mix\n• **CLR** (>26): Proper hydration, balanced diet\n• Avoid adulteration — cooperatives test daily\n• Cool milk to <10°C within 2 hours of milking\n• Use sanitized equipment — pre-dip teats before milking\n• Discard first 3 streams of milk before collecting',
      hi: '🥛 **दूध गुणवत्ता सुधार**\n• **वसा%**: बाईपास फैट, हरा चारा, बिनौला खिलाएं\n• **SNF%**: दाने में 16% प्रोटीन सुनिश्चित करें\n• **CLR** (>26): उचित हाइड्रेशन, संतुलित आहार\n• मिलावट से बचें — सहकारी रोज जांचते हैं\n• दूध 2 घंटे में <10°C तक ठंडा करें\n• स्वच्छ उपकरण, दुहने से पहले निप्पल डिपिंग',
      mr: '🥛 **दूध गुणवत्ता सुधारणा**\n• **फॅट%**: बायपास फॅट, हिरवा चारा, कापूसबी द्या\n• **SNF%**: खुराकात 16% प्रथिने असावीत\n• **CLR** (>26): योग्य पाण्याचे प्रमाण, संतुलित आहार\n• भेसळ टाळा — सहकारी रोज तपासतात\n• दूध 2 तासांत <10°C थंड करा\n• स्वच्छ उपकरणे, दुभण्यापूर्वी टीट डिप',
    },
  },
  {
    patterns: ['government', 'scheme', 'subsidy', 'loan', 'nabard', 'kisan', 'pm', 'सरकार', 'योजना', 'अनुदान', 'सरकारी'],
    answer: {
      en: '🏛️ **Government Schemes for Dairy Farmers**\n• **PM Kisan**: ₹6,000/year direct benefit\n• **NABARD Dairy Loan**: Up to ₹7 lakh at 3–5% interest\n• **Animal Husbandry Infra Fund**: ₹15,000 Cr fund for dairy infra\n• **Rashtriya Gokul Mission**: For indigenous breed development\n• **Kamdhenu Yojana (MH)**: State scheme for breed improvement\n• Apply via **maitriseva.mahaonline.gov.in** or nearest KVK office',
      hi: '🏛️ **डेयरी किसानों के लिए सरकारी योजनाएं**\n• **PM किसान**: ₹6,000/वर्ष प्रत्यक्ष लाभ\n• **NABARD डेयरी ऋण**: 3–5% पर ₹7 लाख तक\n• **पशुपालन अवसंरचना कोष**: ₹15,000 करोड़\n• **राष्ट्रीय गोकुल मिशन**: देशी नस्ल विकास\n• **कामधेनु योजना (MH)**: नस्ल सुधार\n• नजदीकी KVK या **mkisan.gov.in** पर आवेदन करें',
      mr: '🏛️ **दुग्ध शेतकऱ्यांसाठी सरकारी योजना**\n• **PM किसान**: ₹6,000/वर्ष थेट लाभ\n• **NABARD दुग्ध कर्ज**: 3–5% वर ₹7 लाख पर्यंत\n• **पशुसंवर्धन पायाभूत सुविधा निधी**: ₹15,000 कोटी\n• **राष्ट्रीय गोकुल मिशन**: देशी जातींचा विकास\n• **कामधेनु योजना (MH)**: जात सुधारणा\n• जवळच्या KVK किंवा **maitriseva.mahaonline.gov.in** वर अर्ज करा',
    },
  },
];

export const getChatResponse = (input, lang = 'en') => {
  const q = input.toLowerCase().trim();
  if (!q) return null;
  for (const rule of CHAT_RULES) {
    if (rule.patterns.some(p => q.includes(p))) {
      return rule.answer[lang] || rule.answer.en;
    }
  }
  const defaults = {
    en: "I don't have a specific answer for that. Please consult your local vet or agricultural extension officer. You can also check government schemes at **mkisan.gov.in**.",
    hi: "मेरे पास इसका विशिष्ट उत्तर नहीं है। कृपया अपने पशु चिकित्सक से मिलें या **mkisan.gov.in** देखें।",
    mr: "माझ्याकडे याचे विशिष्ट उत्तर नाही. कृपया आपल्या पशुवैद्याला भेटा किंवा **mkisan.gov.in** पहा.",
  };
  return defaults[lang] || defaults.en;
};
