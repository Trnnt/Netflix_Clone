import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, MicOff, Trash2, Copy, Check, ChevronDown, Sparkles, RefreshCw } from 'lucide-react';

// Use absolute URL for reliable backend connectivity
const API_BASE = 'https://netflix-backend-n0s4.onrender.com/api';

async function sendAIMessage(messages, message, userName, apiKey) {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message: message, 
      messages: messages.slice(-10), // Only send last 10 messages for context
      userName: userName,
      apiKey: apiKey
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error ${res.status}`);
  }
  return res.json();
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>')
    .replace(/\n/g, '<br/>');
}

function Timestamp({ date }) {
  return (
    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4, display: 'block' }}>
      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

function RIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="3" y="19"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="20" fontWeight="700" fontStyle="italic"
        fill="#7c3aed" letterSpacing="-1">R</text>
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
      <div style={avatarStyle}><RIcon size={16} /></div>
      <div style={{
        padding: '14px 18px', background: 'rgba(255,255,255,0.05)',
        borderRadius: '20px 20px 20px 4px', border: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(j => (
          <span key={j} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#7c3aed',
            display: 'block', animation: `aiDot 1.4s ${j * 0.2}s infinite ease-in-out`,
          }} />
        ))}
      </div>
    </div>
  );
}

const avatarStyle = {
  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
  background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function HeaderBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 30, height: 30, borderRadius: 8,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s', fontSize: 13,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
      {children}
    </button>
  );
}

const MOODS = [
  { label: 'Thrilled', emoji: '⚡', color: '#f6c90e' },
  { label: 'Chill',    emoji: '🌙', color: '#46d369' },
  { label: 'Emotional',emoji: '💙', color: '#60a5fa' },
  { label: 'Scared',   emoji: '👻', color: '#a78bfa' },
];

const QUICK_PROMPTS = [
  { label: 'Best anime',    icon: '⚔️', prompt: 'What are the best anime to watch right now?' },
  { label: 'K-Drama picks', icon: '🌸', prompt: 'Recommend top K-dramas for tonight' },
  { label: 'Action movies', icon: '💥', prompt: 'Best action movies to watch?' },
  { label: 'Hidden gems',   icon: '💎', prompt: 'What are some hidden gem movies I might have missed?' },
  { label: 'Emotional',     icon: '😢', prompt: 'Suggest something emotional and moving to watch' },
  { label: 'Comedy nights', icon: '😂', prompt: 'Best comedies to watch with friends?' },
];

const MAX_CHARS = 500;

export default function AiChat({ onMovieSelect, userName }) {

  const [open, setOpen]               = useState(false);
  const [minimized, setMinimized]     = useState(false);
  const [userApiKey, setUserApiKey]   = useState(localStorage.getItem('GROQ_API_KEY') || '');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [messages, setMessages]       = useState([{
    role: 'assistant',
    content: "Hey there! I'm your AI movie assistant. Tell me your mood, favourite genre, or just ask — I'll find the perfect watch for you! 🎬",
    timestamp: new Date(),
  }]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [suggestedMovies, setSuggestedMovies] = useState([]);
  const [copiedIdx, setCopiedIdx]     = useState(null);
  const [activeMood, setActiveMood]   = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [charCount, setCharCount]     = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [theme, setTheme]             = useState('dark');
  const [thinkStep, setThinkStep]     = useState(0);

  const thinkSteps = [
    "Analyzing your request...",
    "Scanning Rimuru library...",
    "Matching with your mood...",
    "Finding the best ratings...",
    "Curating Smart Picks..."
  ];

  const bottomRef     = useRef(null);
  const inputRef      = useRef(null);
  const messagesRef   = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 150);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (messages.length > 1) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages]);

  useEffect(() => {
    let interval;
    if (loading) {
      setThinkStep(0);
      interval = setInterval(() => {
        setThinkStep(s => (s + 1) % thinkSteps.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleScroll = () => {
    if (!messagesRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120);
  };

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) { setInput(val); setCharCount(val.length); }
  };

  const copyMessage = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.'); return;
    }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setInput(prev => (prev + ' ' + t).trim().slice(0, MAX_CHARS));
      setCharCount(prev => Math.min(prev + t.length + 1, MAX_CHARS));
    };
    rec.onend = () => setIsListening(false);
    rec.start(); recognitionRef.current = rec; setIsListening(true);
  };

  const clearHistory = () => {
    setMessages([{ role: 'assistant', content: 'Chat cleared! What would you like to watch next? 🎬', timestamp: new Date() }]);
    setSuggestedMovies([]);
  };

  const saveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('GROQ_API_KEY', apiKeyInput.trim());
      setUserApiKey(apiKeyInput.trim());
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const send = useCallback(async (overrideMsg = null) => {
    const msg = (overrideMsg || input).trim();
    if (!msg || loading) return;

    const moodPrefix = activeMood ? `[Mood: ${activeMood}] ` : '';
    const fullMsg = moodPrefix + msg;

    setInput(''); setCharCount(0); setSuggestedMovies([]);

    const userMsg = { role: 'user', content: msg, timestamp: new Date() };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setLoading(true);
    setIsSyncing(false);

    try {
      const apiHistory = updatedMsgs.slice(-12).map(m => ({
        role: m.role,
        content: m.content,
      }));
      const { reply, suggestedMovies: movies } = await sendAIMessage(apiHistory, fullMsg, userName, userApiKey);
      
      setMessages(prev => [...prev, { role: 'assistant', content: reply, timestamp: new Date() }]);
      
      if (movies?.length > 0) {
        setIsSyncing(true);
        setTimeout(() => {
          setSuggestedMovies(movies);
          setIsSyncing(false);
        }, 800);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant', isError: true,
        content: `⚠️ ${err.message || 'Could not reach the AI. Is the backend running?'}`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, activeMood, userName]);


  const handleMovieClick = async (movie) => {
    if (!onMovieSelect) return;
    try {
      // Fetch full details from TMDB via backend proxy
      const res = await fetch(`${API_BASE}/movies/${movie.id}/details?type=${movie.type || ''}`);
      if (res.ok) {
        const fullMovie = await res.json();
        onMovieSelect(fullMovie);
      } else {
        // Fallback to minimal data if details fetch fails
        onMovieSelect(movie);
      }
      setOpen(false); // Close chat when movie is selected
    } catch (e) {
      onMovieSelect(movie);
      setOpen(false);
    }
  };

  const bgColor = theme === 'dim' ? 'rgba(12,8,22,0.95)' : 'rgba(10,10,10,0.93)';

  return (
    <>
      <button
        onClick={() => { setOpen(o => !o); setUnreadCount(0); }}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 99998,
          width: 60, height: 60, borderRadius: '50%',
          background: 'linear-gradient(145deg, #7c3aed 0%, #3b0764 100%)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? '0 4px 20px rgba(124,58,237,0.3)' : '0 8px 32px rgba(124,58,237,0.5), 0 2px 8px rgba(0,0,0,0.4)',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          transform: open ? 'rotate(45deg) scale(0.9)' : 'scale(1)',
          animation: open ? 'none' : 'aiPulse 3s infinite',
        }}
        title="AI Movie Assistant"
      >
        {open ? <X size={22} color="#fff" /> : <RIcon size={26} />}
        {!open && unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            background: '#46d369', color: '#000',
            fontSize: 10, fontWeight: 800, borderRadius: '50%',
            width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #141414',
          }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      <div style={{
        position: 'fixed', bottom: 100, right: 28, zIndex: 99997,
        width: 400, height: minimized ? 72 : 600,
        background: bgColor, border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 24, backdropFilter: 'blur(40px) saturate(200%)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'all 0.45s cubic-bezier(0.16,1,0.3,1)',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.93)',
        pointerEvents: open ? 'auto' : 'none',
      }}>

        {/* HEADER */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(180deg, rgba(124,58,237,0.12) 0%, transparent 100%)',
          borderBottom: minimized ? 'none' : '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <RIcon size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: 0.2 }}>
              AI Assistant
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: loading ? '#f6c90e' : '#46d369',
                boxShadow: loading ? '0 0 6px #f6c90e' : '0 0 6px #46d369',
                transition: 'all 0.3s',
                animation: loading ? 'statusPulse 1s infinite' : 'none',
              }} />
              <span style={{ fontSize: 11, color: loading ? '#f6c90e' : '#46d369', transition: 'all 0.3s' }}>
                {loading ? thinkSteps[thinkStep] : 'System Online'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <HeaderBtn onClick={() => setTheme(t => t === 'dark' ? 'dim' : 'dark')} title="Toggle theme">
              {theme === 'dark' ? '🌙' : '☀️'}
            </HeaderBtn>
            <HeaderBtn onClick={clearHistory} title="Clear chat">
              <Trash2 size={14} color="rgba(255,255,255,0.4)" />
            </HeaderBtn>
            <HeaderBtn onClick={() => setMinimized(m => !m)} title={minimized ? 'Expand' : 'Minimize'}>
              <ChevronDown size={16} color="rgba(255,255,255,0.4)"
                style={{ transform: minimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
            </HeaderBtn>
            <HeaderBtn onClick={() => setOpen(false)} title="Close">
              <X size={16} color="rgba(255,255,255,0.4)" />
            </HeaderBtn>
          </div>
        </div>

        {!minimized && (
          <>
            {/* MOOD BAR */}
            <div style={{ padding: '10px 20px 0', display: 'flex', gap: 8, flexShrink: 0 }}>
              {MOODS.map(m => (
                <button key={m.label} onClick={() => setActiveMood(activeMood === m.label ? null : m.label)}
                  style={{
                    flex: 1, padding: '6px 4px', borderRadius: 12,
                    border: activeMood === m.label ? `1.5px solid ${m.color}` : '1px solid rgba(255,255,255,0.07)',
                    background: activeMood === m.label ? `${m.color}20` : 'rgba(255,255,255,0.03)',
                    color: activeMood === m.label ? m.color : 'rgba(255,255,255,0.45)',
                    fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}>
                  <span style={{ fontSize: 14 }}>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* MESSAGES */}
            <div ref={messagesRef} onScroll={handleScroll} style={{
              flex: 1, overflowY: 'auto', padding: '16px 20px',
              display: 'flex', flexDirection: 'column', gap: 14,
              scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.3) transparent',
            }}>
              {messages.map((m, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end', gap: 10,
                  animation: 'fadeSlideUp 0.3s ease forwards',
                }}>
                  {m.role === 'assistant' && <div style={avatarStyle}><RIcon size={16} /></div>}
                  <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      padding: '11px 15px',
                      borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      background: m.role === 'user'
                        ? 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)'
                        : m.isError ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)',
                      color: '#fff', fontSize: 13.5, lineHeight: 1.65,
                      border: m.role === 'user' ? 'none'
                        : m.isError ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: m.role === 'user' ? '0 4px 16px rgba(124,58,237,0.2)' : 'none',
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: formatText(m.content) }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, padding: '0 4px' }}>
                      {m.timestamp && <Timestamp date={m.timestamp} />}
                      {m.role === 'assistant' && !m.isError && (
                        <button onClick={() => copyMessage(m.content, i)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                          color: copiedIdx === i ? '#46d369' : 'rgba(255,255,255,0.2)', transition: 'color 0.2s',
                        }}>
                          {copiedIdx === i ? <Check size={11} /> : <Copy size={11} />}
                        </button>
                      )}
                      {m.isError && (
                        <button onClick={() => send(messages[i - 1]?.content)} style={{
                          fontSize: 10, padding: '3px 10px', borderRadius: 6,
                          border: '1px solid rgba(124,58,237,0.4)', background: 'transparent',
                          color: '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <RefreshCw size={9} /> Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {suggestedMovies.length > 0 && (
                <div style={{ marginTop: 22, animation: 'fadeSlideUp 0.4s ease forwards' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 4px', marginBottom: 12
                  }}>
                    <p style={{
                      margin: 0, fontSize: 13, fontWeight: 700, color: '#a78bfa',
                      letterSpacing: 0.5, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      <Sparkles size={14} /> Smart Picks
                    </p>
                    {isSyncing && (
                      <span style={{
                        fontSize: 10, color: '#f6c90e', display: 'flex', alignItems: 'center', gap: 4,
                        animation: 'statusPulse 1s infinite'
                      }}>
                        <RefreshCw size={10} style={{ animation: 'spin 2s linear infinite' }} /> Syncing Smart Picks...

                      </span>
                    )}
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12,
                    opacity: isSyncing ? 0.5 : 1, transition: 'opacity 0.3s',
                    overflowX: 'auto',
                    paddingBottom: 8, scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}>
                    {suggestedMovies.map(m => (
                      <div key={m.id} onClick={() => handleMovieClick(m)} style={{
                        flexShrink: 0, width: 140, borderRadius: 16, overflow: 'hidden',
                        border: '1px solid rgba(124,58,237,0.2)', 
                        background: 'rgba(255,255,255,0.03)',
                        cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative'
                      }}
                        onMouseEnter={e => { 
                          e.currentTarget.style.transform = 'translateY(-6px)'; 
                          e.currentTarget.style.borderColor = '#7c3aed'; 
                          e.currentTarget.style.background = 'rgba(124,58,237,0.08)';
                          e.currentTarget.style.boxShadow = '0 12px 30px rgba(124,58,237,0.15)'; 
                        }}
                        onMouseLeave={e => { 
                          e.currentTarget.style.transform = ''; 
                          e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)'; 
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          e.currentTarget.style.boxShadow = 'none'; 
                        }}
                      >
                        <div style={{ position: 'relative', height: 80 }}>
                          <img src={m.thumbnail || m.poster} alt={m.title}
                            style={{ 
                              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                              textIndent: '-10000px' // Hide alt text to prevent doubling
                            }}
                            onError={e => { e.target.src = `https://via.placeholder.com/140x80/1a1a2e/7c3aed?text=${encodeURIComponent(m.title)}`; }}
                          />

                          <div style={{ 
                            position: 'absolute', inset: 0, 
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 70%)' 
                          }} />
                        </div>
                        <div style={{ padding: '10px 12px' }}>
                          <p style={{ 
                            margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            gap: 4
                          }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</span>
                            <span style={{ color: '#f6c90e', fontSize: 11, flexShrink: 0 }}>★ {m.rating}</span>
                          </p>
                          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                            <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>{m.year}</span>
                            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', textTransform: 'uppercase' }}>{m.type || 'Show'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {showScrollBtn && (
              <button onClick={scrollToBottom} style={{
                position: 'absolute', bottom: 140, right: 24,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(124,58,237,0.8)', border: 'none', cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 10,
              }}>
                <ChevronDown size={16} />
              </button>
            )}

            {messages.length <= 1 && !loading && (
              <div style={{ padding: '0 20px 10px', display: 'flex', flexWrap: 'wrap', gap: 7, flexShrink: 0 }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p.label} onClick={() => send(p.prompt)} style={{
                    fontSize: 11.5, padding: '6px 12px', borderRadius: 20,
                    border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.07)',
                    color: 'rgba(255,255,255,0.75)', cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.18)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.6)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}>
                    <span>{p.icon}</span> {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* INPUT AREA OR API KEY PROMPT */}
            <div style={{
              padding: '14px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(0,0,0,0.2)', flexShrink: 0,
            }}>
              {!userApiKey ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#f6c90e', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={14} /> Please enter your Groq API Key to start chatting:
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="gsk_..."
                      style={{
                        flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 14, padding: '10px 14px', color: '#fff', fontSize: 13.5, outline: 'none'
                      }}
                    />
                    <button onClick={saveApiKey} style={{
                      padding: '0 16px', borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
                      border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13
                    }}>
                      Save Key
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {activeMood && (
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Mood:</span>
                      <span style={{
                        fontSize: 11, padding: '2px 10px', borderRadius: 10,
                        background: `${MOODS.find(m => m.label === activeMood)?.color}20`,
                        color: MOODS.find(m => m.label === activeMood)?.color,
                        border: `1px solid ${MOODS.find(m => m.label === activeMood)?.color}40`,
                      }}>
                        {MOODS.find(m => m.label === activeMood)?.emoji} {activeMood}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <textarea
                        ref={inputRef} value={input} onChange={handleInputChange}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                        placeholder="Ask about movies, anime, shows..."
                        rows={1}
                        style={{
                          width: '100%', resize: 'none', overflow: 'hidden',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 14, padding: '12px 14px', color: '#fff',
                          fontSize: 13.5, outline: 'none', transition: 'all 0.25s',
                          lineHeight: 1.5, boxSizing: 'border-box', fontFamily: 'inherit',
                        }}
                        onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.07)'; e.target.style.borderColor = 'rgba(124,58,237,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
                        onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                        onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }}
                      />
                      {input.length > 0 && (
                        <span style={{
                          position: 'absolute', bottom: 6, right: 10, fontSize: 10,
                          color: charCount > MAX_CHARS * 0.8 ? '#f6c90e' : 'rgba(255,255,255,0.2)',
                        }}>{charCount}/{MAX_CHARS}</span>
                      )}
                    </div>
                    <button onClick={toggleVoice} style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: isListening ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      border: isListening ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer', color: isListening ? '#7c3aed' : 'rgba(255,255,255,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s',
                      animation: isListening ? 'statusPulse 1s infinite' : 'none',
                    }}>
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                    <button onClick={() => send()} disabled={!input.trim() || loading} style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: input.trim() && !loading ? 'linear-gradient(135deg, #7c3aed, #4c1d95)' : 'rgba(255,255,255,0.04)',
                      border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: input.trim() && !loading ? '0 4px 20px rgba(124,58,237,0.35)' : 'none',
                      transition: 'all 0.25s',
                    }}
                      onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.transform = 'scale(1.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes aiPulse {
          0%,100% { box-shadow: 0 8px 32px rgba(124,58,237,0.5); }
          50% { box-shadow: 0 8px 48px rgba(124,58,237,0.75); transform: translateY(-3px); }
        }
        @keyframes aiDot {
          0%,80%,100% { transform: scale(0.55); opacity: 0.25; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes statusPulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}
