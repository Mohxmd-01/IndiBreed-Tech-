import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader, Mic, MicOff, Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getChatResponse } from '../data/chatRules';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SYSTEM_PROMPT = `You are NiralFarm AI, an expert agricultural assistant for Indian dairy farmers. 
You speak in simple, farmer-friendly language. You know about:
- Cattle health, diseases, symptoms and treatments
- Milk production optimization and troubleshooting
- Vaccination schedules for Indian cattle breeds (FMD, HS, BQ, PPR, Brucellosis)
- Feeding and nutrition for dairy cows
- Calving preparation and reproduction
- Smart collar IoT device care
- Indian cattle breeds: Gir, HF Cross, Sahiwal, Jersey Cross, Murrah Buffalo, Tharparkar, Rathi, Kankrej
- Seasonal farming advice for Maharashtra/India
- Government schemes like PM Kisan, Animal Husbandry Infra Fund
Always give practical, actionable advice. Use bullet points. Keep responses concise under 150 words.
If asked in Hindi or Marathi, respond in that language.`;

function renderMd(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

// SpeechRecognition wrapper
function useSpeechRecognition({ onResult, lang }) {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const start = useCallback(() => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
  }, [supported, lang, onResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, start, stop };
}

export default function Chatbot() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: t('chatbotWelcome'), ts: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('niralFarm_apiKey') || '');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Save default API key on first load
  useEffect(() => {
    if (!localStorage.getItem('niralFarm_apiKey')) {
      localStorage.setItem('niralFarm_apiKey', apiKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const getAIResponse = useCallback(async (question) => {
    const key = localStorage.getItem('niralFarm_apiKey') || apiKey;
    if (!key) return getChatResponse(question, lang);

    try {
      const resp = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://niralFarm.app',
          'X-Title': 'NiralFarm AI',
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: question }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });
      if (!resp.ok) throw new Error('API error');
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || getChatResponse(question, lang);
    } catch {
      // Fallback to rule-based
      return getChatResponse(question, lang);
    }
  }, [apiKey, lang]);

  const send = useCallback(async (overrideText) => {
    const q = (overrideText ?? input).trim();
    if (!q) return;
    setMessages(m => [...m, { from: 'user', text: q, ts: Date.now() }]);
    setInput('');
    setTyping(true);
    const ans = await getAIResponse(q);
    setMessages(m => [...m, { from: 'bot', text: ans, ts: Date.now() }]);
    setTyping(false);
  }, [input, getAIResponse]);

  const onVoiceResult = useCallback((text) => {
    setInput(text);
    setTimeout(() => send(text), 200);
  }, [send]);

  const { supported: voiceSupported, listening, start: startListening, stop: stopListening } = useSpeechRecognition({ onResult: onVoiceResult, lang });

  const saveApiKey = () => {
    localStorage.setItem('niralFarm_apiKey', apiKey);
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
    setShowApiInput(false);
  };

  const QUICK = [
    t('chatbotQuick1'), t('chatbotQuick2'), t('chatbotQuick3'),
    t('chatbotQuick4'), t('chatbotQuick5'),
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label="Open Farm Assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && messages.length > 1 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
            {messages.filter(m => m.from === 'bot').length}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxHeight: '75vh' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{t('chatbotTitle')}</p>
              <p className="text-green-100 text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse inline-block" />
                {t('chatbotPoweredBy')} • {lang.toUpperCase()}
              </p>
            </div>
            <button onClick={() => setShowApiInput(v => !v)} className="text-white/60 hover:text-white p-1" title={t('apiKeyLabel')}>
              <Key size={14} />
            </button>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white"><X size={16} /></button>
          </div>

          {/* API key input */}
          {showApiInput && (
            <div className="px-3 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] text-gray-500 mb-1.5">{t('apiKeyInfo')}</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={t('apiKeyPlaceholder')}
                  className="flex-1 text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-400"
                />
                <button onClick={saveApiKey} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg font-semibold hover:bg-green-700">
                  {apiKeySaved ? '✓' : t('save')}
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${m.from === 'bot' ? 'bg-green-100' : 'bg-blue-100'}`}>
                  {m.from === 'bot' ? <Bot size={14} className="text-green-600" /> : <User size={14} className="text-blue-600" />}
                </div>
                <div className={`max-w-[82%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  m.from === 'bot' ? 'bg-white text-gray-700 border border-gray-100 shadow-sm' : 'bg-green-600 text-white'
                }`}>
                  {m.from === 'bot'
                    ? <span dangerouslySetInnerHTML={{ __html: renderMd(m.text) }} />
                    : m.text
                  }
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-xl bg-green-100 flex items-center justify-center">
                  <Bot size={14} className="text-green-600" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl px-3 py-2.5 flex gap-1 items-center shadow-sm">
                  <Loader size={12} className="text-green-500 animate-spin mr-1" />
                  <span className="text-xs text-gray-400">{t('chatbotThinking')}</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Voice listening indicator */}
          {listening && (
            <div className="px-3 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-red-600">{t('chatbotListening')}</span>
            </div>
          )}

          {/* Quick questions */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 border-t border-gray-100 bg-white">
              <p className="text-[10px] text-gray-400 mb-1.5 font-medium">Quick questions:</p>
              <div className="flex flex-wrap gap-1">
                {QUICK.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-semibold rounded-lg hover:bg-green-100 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className="px-3 py-3 border-t border-gray-100 bg-white flex gap-2 items-center">
            <input
              ref={inputRef}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
              placeholder={t('chatbotPlaceholder')}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !typing && send()}
            />
            {/* Voice button */}
            {voiceSupported ? (
              <button
                onClick={listening ? stopListening : startListening}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  listening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title={listening ? 'Stop' : 'Voice input'}
              >
                {listening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            ) : null}
            <button onClick={() => send()} disabled={!input.trim() || typing}
              className="w-9 h-9 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
