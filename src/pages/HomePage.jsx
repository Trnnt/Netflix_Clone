import { useState, useEffect, useRef, useCallback } from "react";
import { trackWatch, trackDownload, getCurrentUser, getTvSeasons, getSeasonEpisodes } from "../services/movieApi.js";
import { Play, Info, Plus, ThumbsUp, Bell, Search, ChevronLeft, ChevronRight, X, Volume2, VolumeX, Star, Clock, Download, Share2, Bookmark, Film, User, Users, Settings, LogOut, Menu, Sparkles, Check, Save, Activity, ChevronDown, RotateCcw, RotateCw } from "lucide-react";
import AiChat from "../components/AiChat.jsx";

/* ─── API & TOAST ────────────────────────────────────────── */
export const toastEvent = new EventTarget();
export const showToast = (msg) => toastEvent.dispatchEvent(new CustomEvent('toast', { detail: msg }));

const API = 'http://localhost:5000/api';
async function apiFetch(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error('API ' + path);
  return res.json();
}
async function authFetch(path, opts = {}) {
  const token = localStorage.getItem('netflix_token') || '';
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`API ${path} ${res.status}`);
  return res.json();
}

function useMovieData() {
  const empty = { trending: [], hollywood: [], anime: [], kdrama: [], cdrama: [], jdrama: [], wollywood: [], cartoon: [], picks: [] };
  const [rows, setRows] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const genres = ['hollywood', 'anime', 'kdrama', 'cdrama', 'jdrama', 'wollywood', 'cartoon'];
    const safeFetch = path => apiFetch(path).catch(e => { console.warn(path, 'Failed', e); return []; });

    Promise.all([safeFetch('/movies/trending'), ...genres.map(g => safeFetch('/movies/genre/' + g))])
      .then(([trending, ...rest]) => {
        const trendingList = Array.isArray(trending) ? trending : [];
        const r = {
          trending: trendingList,
          picks: [...trendingList].sort(() => Math.random() - .5)
        };
        genres.forEach((g, i) => {
          r[g] = Array.isArray(rest[i]) ? rest[i] : [];
        });

        const hasAnyMovie = r.trending.length > 0 || genres.some(g => r[g].length > 0);
        if (!hasAnyMovie) {
          setError("Backend Connection Failed: TMDB proxy returned no data. Your TMDB token might be invalid or rate-limited.");
        } else {
          setError(null);
        }

        setRows(r);
      })
      .catch((e) => {
        console.warn('Backend offline or API error', e);
        setError("Backend Connection Failed: " + (e.message || "Unknown Error"));
      })
      .finally(() => setLoading(false));
  }, []);
  return { rows, loading, error };
}


/* ─── CONSTANTS ───────────────────────────────────────────── */
const GENRES = [
  { label: "Anime", key: "anime", emoji: "🗡️" },
  { label: "Cartoon", key: "cartoon", emoji: "🎨" },
  { label: "Hollywood", key: "hollywood", emoji: "🎬" },
  { label: "Wollywood", key: "wollywood", emoji: "🎭" },
  { label: "K-Drama", key: "kdrama", emoji: "🌸" },
  { label: "C-Drama", key: "cdrama", emoji: "🐉" },
  { label: "J-Drama", key: "jdrama", emoji: "⛩️" },
];
const NAV_ITEMS = ["Home", "Anime", "Cartoon", "Hollywood", "Wollywood", "K-Drama", "C-Drama", "J-Drama"];
const NOTIFS = [
  { id: 1, text: "New episode of Demon Slayer is out!", time: "2h ago", img: "https://image.tmdb.org/t/p/w92/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg" },
  { id: 2, text: "Attack on Titan Final Season added", time: "1d ago", img: "https://image.tmdb.org/t/p/w92/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg" },
  { id: 3, text: "New K-Drama recommendations for you", time: "2d ago", img: "https://image.tmdb.org/t/p/w92/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg" },
];

/* ─── PARTICLES / AURORA ──────────────────────────────────── */
function Particles() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext("2d"); let id;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 60 }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, r: Math.random() * 1.2 + 0.3, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, a: Math.random() * .4 + .1 }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => { p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0; if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = "rgba(229,9,20," + p.a + ")"; ctx.fill(); });
      pts.forEach((p, i) => pts.slice(i + 1).forEach(q => { const d = Math.hypot(p.x - q.x, p.y - q.y); if (d < 90) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = "rgba(229,9,20," + (0.07 * (1 - d / 90)) + ")"; ctx.lineWidth = .4; ctx.stroke(); } }));
      id = requestAnimationFrame(draw);
    }; draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: .5 }} />;
}
const Aurora = () => (<div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}><div className="au1" /><div className="au2" /><div className="au3" /></div>);

/* ─── NAVBAR ─────────────────────────────────────────────── */
function Navbar({ scrolled, category, setCategory, onSearch, setActiveModal, onLogout, trending, anime, onMovieSelect }) {
  const [srchOpen, setSrchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profOpen, setProfOpen] = useState(false);
  const [mobOpen, setMobOpen] = useState(false);
  const [hov, setHov] = useState(null);
  const sr = useRef(null), nr = useRef(null), pr = useRef(null), inp = useRef(null);
  useEffect(() => { if (srchOpen) inp.current?.focus(); }, [srchOpen]);
  useEffect(() => {
    const h = e => {
      if (e.key === "Escape") { setSrchOpen(false); setNotifOpen(false); setProfOpen(false); setQ(""); onSearch(""); }
      if (e.type === "mousedown") { if (!sr.current?.contains(e.target)) setSrchOpen(false); if (!nr.current?.contains(e.target)) setNotifOpen(false); if (!pr.current?.contains(e.target)) setProfOpen(false); }
    };
    document.addEventListener("keydown", h); document.addEventListener("mousedown", h);
    return () => { document.removeEventListener("keydown", h); document.removeEventListener("mousedown", h); };
  }, [onSearch]);
  const profMenu = [
    { icon: <User size={14} />, label: "Edit Profile", modal: "profile" },
    { icon: <Bookmark size={14} />, label: "Watchlist", modal: "mylist" },
    { icon: <Download size={14} />, label: "Downloads", modal: "downloads" },
    { icon: <Settings size={14} />, label: "Settings", modal: "settings" },
    { icon: <LogOut size={14} />, label: "Sign Out", modal: "signout" },
  ];
  const user = JSON.parse(localStorage.getItem('netflix_user') || '{"name": "User"}');
  
  const combinedNotifs = [
    ...(trending && trending.length > 0 ? trending.slice(0, 2).map(m => ({ ...m, notifType: 'release' })) : []),
    ...(anime && anime.length > 0 ? anime.slice(0, 2).map(m => ({ ...m, notifType: 'anime episode' })) : [])
  ];

  return (
    <nav className={"nb" + (scrolled ? " sc" : "")}>
      <div className="nb-l">
        <div className="logo" onClick={() => setCategory("Home")}><span className="le" style={{ fontSize: 28, letterSpacing: 1, fontWeight: 900, background: 'linear-gradient(to right, #e50914, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>RIMURU</span></div>
        <ul className="nl">
          {NAV_ITEMS.map(c => (
            <li key={c} data-cat={c} className={category === c ? "act" : ""} onMouseEnter={() => setHov(c)} onMouseLeave={() => setHov(null)} onClick={() => setCategory(c)}>
              {c}<span className={"nul" + (hov === c || category === c ? " vis" : "")} />
            </li>
          ))}

        </ul>
        <button className="mob-hbg" onClick={() => setMobOpen(m => !m)}><Menu size={20} /></button>
      </div>
      <div className="nb-r">
        <div ref={sr} className={"sw" + (srchOpen ? " op" : "")}>
          <button className="ib" onClick={() => setSrchOpen(s => !s)}><Search size={19} /></button>
          <input ref={inp} className="si" placeholder="Titles, genres..." value={q} onChange={e => { setQ(e.target.value); onSearch(e.target.value); }} />
        </div>
        <div ref={nr} className="drop-a">
          <button className="ib nb2" onClick={() => { setNotifOpen(n => !n); setProfOpen(false); }}><Bell size={19} /><span className="nd" /></button>
          {notifOpen && <div className="dd ndd">
            <p className="ddh">NOTIFICATIONS</p>
            {combinedNotifs.length > 0 ? combinedNotifs.map((m, i) => (
              <div key={m.id || i} className="ni" onClick={() => { setNotifOpen(false); onMovieSelect && onMovieSelect(m); }} style={{ cursor: 'pointer' }}>
                <img src={m.thumbnail ? m.thumbnail : "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"} alt="" className="nth" style={{ objectFit: 'cover' }} />
                <div>
                  <p className="ntx">New {m.notifType}: {m.title} is now available!</p>
                  <p className="ntm">Just now</p>
                </div>
              </div>
            )) : (
              <div className="ni" style={{ padding: '20px', textAlign: 'center' }}><p className="ntx" style={{ opacity: 0.6 }}>No new notifications</p></div>
            )}
          </div>}
        </div>
        <div ref={pr} className="drop-a">
          <button className="pb" onClick={() => { setProfOpen(p => !p); setNotifOpen(false); }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" className="av" alt="av" />
            <span className="an">{user.name}</span>
            <ChevronLeft size={13} style={{ transform: profOpen ? "rotate(-90deg)" : "rotate(-180deg)", transition: "transform .3s" }} />
          </button>
          {profOpen && <div className="dd pdd">
            <div className="ph"><img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" width={40} style={{ borderRadius: 4 }} alt="av" /><div><p className="phn">{user.name}</p><p className="php">Premium · 4K HDR</p></div></div>
            {profMenu.map(item => (
              <button key={item.label} className={"pmi" + (item.modal === "signout" ? " so" : "")} onClick={() => {
                setProfOpen(false);
                if (item.modal === "signout") {
         const handleLogout = () => {
    localStorage.removeItem("netflix_token");
    localStorage.removeItem("netflix_user");
    window.location.href = "/"; // Force full reload to reset all states
  };
                  handleLogout(); // Call the function
                } else {
                  setActiveModal(item.modal);
                }
              }}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}

          </div>}
        </div>
      </div>
      {mobOpen && <div className="mm">{NAV_ITEMS.map(c => <button key={c} data-cat={c} className={"mmi" + (category === c ? " act" : "")} onClick={() => { setCategory(c); setMobOpen(false); }}>{c}</button>)}</div>}
    </nav>
  );
}

/* ─── GENRE STRIP ────────────────────────────────────────── */
function GenreStrip({ active, setActive }) {
  return (
    <div className="gs">
      {GENRES.map(g => (
        <button key={g.key} data-cat={g.label} className={"gc" + (active === g.key ? " gca" : "")} onClick={() => setActive(p => p === g.key ? null : g.key)}>
          <span className="ge">{g.emoji}</span><span className="gl">{g.label}</span><span className="gu" />
        </button>
      ))}

    </div>
  );
}

/* ─── HERO ───────────────────────────────────────────────── */
function Hero({ movie, onOpen, onPlay, heroIdx, heroCount, onDotClick }) {
  const [muted, setMuted] = useState(true);
  const [prog, setProg] = useState(0);
  const [inList, setInList] = useState(false);
  const [liked, setLiked] = useState(false);
  const [listAnim, setListAnim] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);

  useEffect(() => { setProg(0); const t = setInterval(() => setProg(p => Math.min(p + 1, 100)), 80); return () => clearInterval(t); }, [movie]);

  useEffect(() => {
    if (!movie) return;
    authFetch(`/mylist/${movie.id}/check`).then(r => setInList(r.inList)).catch(() => {});
    authFetch(`/likes/${movie.id}/check`).then(r => setLiked(r.liked)).catch(() => {});
  }, [movie?.id]);

  if (!movie || !movie.title) return null;

  const handleAdd = async () => {
    try {
      const genre = (movie.tags || [])[0] || movie.genre || '';
      const body = JSON.stringify({ 
        movie_id: movie.id, movie_title: movie.title, movie_thumbnail: movie.thumbnail, 
        movie_year: movie.year || '', movie_rating: movie.rating || '', movie_genre: genre 
      });
      if (inList) {
        await authFetch(`/mylist/${movie.id}`, { method: 'DELETE' });
        setInList(false); showToast('Removed from Watchlist');
      } else {
        await authFetch('/mylist', { method: 'POST', body });
        await authFetch('/downloads', { method: 'POST', body }).catch(() => {});
        setInList(true); setListAnim(true); setTimeout(() => setListAnim(false), 600);
        showToast('✅ Added to Watchlist!');
        const u = getCurrentUser(); if (u) trackDownload(u, movie);
      }
    } catch { showToast('⚠️ Sign in to add to Watchlist'); }
  };

  const handleLike = async () => {
    try {
      const genre = (movie.tags || [])[0] || movie.genre || '';
      if (liked) {
        await authFetch(`/likes/${movie.id}`, { method: 'DELETE' });
        setLiked(false); showToast('Removed from Liked');
      } else {
        await authFetch('/likes', { method: 'POST', body: JSON.stringify({ movie_id: movie.id, movie_title: movie.title, movie_thumbnail: movie.thumbnail, movie_year: movie.year || '', movie_genre: genre }) });
        setLiked(true); setLikeAnim(true); setTimeout(() => setLikeAnim(false), 600);
        showToast('❤️ Added to Liked!');
      }
    } catch { showToast('⚠️ Sign in to like'); }
  };

  return (
    <div className="hero">
      <div className="hero-bg" style={{ backgroundImage: "url('" + movie.backdrop + "')" }} />
      <div className="hvig" /><div className="hfade" />
      <div className="hcnt">
        <div className="hbdg"><Sparkles size={11} /> FEATURED</div>
        <h1 className="htitle">{movie.title}</h1>
        <div className="hmeta">
          <span className="hmatch">{movie.match}% Match</span>
          <span className="hyr">{movie.year}</span>
          <span className="hmat">{movie.maturity}</span>
          <span className="hep">{movie.episodes}</span>
          <Star size={11} fill="#f6c90e" color="#f6c90e" />
          <span style={{ color: "#f6c90e", fontWeight: 700, fontSize: 13 }}>{movie.rating}</span>
        </div>
        <p className="hdesc">{movie.desc}</p>
        <div className="hacts">
          <button className="bplay" onClick={() => onPlay(movie)}><Play fill="#000" size={20} /> Play</button>
          <button className="bmore" onClick={() => onOpen(movie)}><Info size={18} /> More Info</button>
          <button className="badd" onClick={handleAdd} title={inList ? 'Remove from Watchlist' : 'Add to Watchlist'}
            style={{ background: inList ? 'rgba(70,211,105,0.2)' : 'rgba(255,255,255,0.15)', border: inList ? '2px solid #46d369' : '2px solid rgba(255,255,255,0.5)', transform: listAnim ? 'scale(1.3)' : 'scale(1)', transition: 'all 0.25s cubic-bezier(.34,1.56,.64,1)' }}>
            {inList ? <Check size={18} color="#46d369" /> : <Plus size={18} />}
          </button>
          <button onClick={handleLike} title={liked ? 'Unlike' : 'Like'}
            style={{ width: 44, height: 44, borderRadius: '50%', border: liked ? '2px solid #e50914' : '2px solid rgba(255,255,255,0.5)', background: liked ? 'rgba(229,9,20,0.2)' : 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: liked ? '#e50914' : '#fff', transform: likeAnim ? 'scale(1.35)' : 'scale(1)', transition: 'all 0.25s cubic-bezier(.34,1.56,.64,1)' }}>
            <ThumbsUp size={18} fill={liked ? '#e50914' : 'none'} />
          </button>
        </div>
        <div className="hpb"><div style={{ width: prog + "%", height: "100%", background: "#e50914", borderRadius: 2, transition: "width .08s linear" }} /></div>
      </div>
      <button className="hmute" onClick={() => setMuted(m => !m)}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
      <div className="hmatb">{movie.maturity}</div>
      {heroCount > 1 && <div className="hero-dots">{Array.from({length: heroCount}, (_, i) => (
        <button key={i} className={"hero-dot" + (i === heroIdx ? " active" : "")} onClick={e => { e.stopPropagation(); onDotClick(i); }} />
      ))}</div>}
    </div>
  );
}

/* ─── CARD ───────────────────────────────────────────────── */
function Card({ movie, onOpen, onPlay, rank, pos }) {
  const [hov, setHov] = useState(false);
  const [list, setList] = useState(false);
  const [listAnim, setListAnim] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeAnim, setLikeAnim] = useState(false);
  const timer = useRef(null);

  // Check if already in list/liked on hover
  useEffect(() => {
    if (hov) {
      authFetch(`/mylist/${movie.id}/check`).then(res => setList(res.inList)).catch(() => { });
      authFetch(`/likes/${movie.id}/check`).then(res => setLiked(res.liked)).catch(() => { });
    }
  }, [hov, movie.id]);

  const toggleList = async (e) => {
    e.stopPropagation();
    const prev = list;
    setList(!prev);
    if (!prev) { setListAnim(true); setTimeout(() => setListAnim(false), 600); showToast('✅ Added to Watchlist!'); }
    try {
      const genre = (movie.tags || [])[0] || movie.genre || '';
      if (prev) {
        await authFetch(`/mylist/${movie.id}`, { method: 'DELETE' });
      } else {
        const body = JSON.stringify({
          movie_id: movie.id, movie_title: movie.title, movie_thumbnail: movie.thumbnail,
          movie_year: movie.year || '', movie_rating: movie.rating || '', movie_genre: genre
        });
        await authFetch('/mylist', { method: 'POST', body });
        await authFetch('/downloads', { method: 'POST', body }).catch(() => { });
        const u = getCurrentUser(); if (u) trackDownload(u, movie);
      }
    } catch { setList(prev); showToast('⚠️ Sign in to manage list'); }
  };

  const toggleLike = async (e) => {
    e.stopPropagation();
    const prev = liked;
    setLiked(!prev);
    if (!prev) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 600); showToast('❤️ Liked!'); }
    try {
      const genre = (movie.tags || [])[0] || movie.genre || '';
      if (prev) {
        await authFetch(`/likes/${movie.id}`, { method: 'DELETE' });
      } else {
        await authFetch('/likes', { method: 'POST', body: JSON.stringify({ movie_id: movie.id, movie_title: movie.title, movie_thumbnail: movie.thumbnail, movie_year: movie.year || '', movie_genre: genre }) });
      }
    } catch { setLiked(prev); showToast('⚠️ Sign in to like'); }
  };

  const origin = pos === 'first' ? '0% 50%' : pos === 'last' ? '100% 50%' : '50% 50%';
  return (
    <div className={"card" + (hov ? " chov" : "")} style={{ transformOrigin: origin }}
      onMouseEnter={() => { timer.current = setTimeout(() => setHov(true), 350); }}
      onMouseLeave={() => { clearTimeout(timer.current); setHov(false); }}
      onClick={() => onOpen(movie)}>
      {rank && <span className="rnk">{rank}</span>}
      <div className="cib">
        <img src={movie.thumbnail || "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"} alt={movie.title} className="cimg" onError={e => { e.target.src = "https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png"; }} style={{ objectFit: 'cover' }} />
        <div className="cgr" />
        <div className="card-play-ov"><Play size={26} fill="#fff" color="#fff" /></div>
        <div className="card-hd-badge">HD</div>
        {movie.match >= 95 && <div className="card-new-badge">🔥 HOT</div>}
        {rank && rank <= 3 && <div className="card-top-badge">TOP {rank}</div>}
        <div className="crat"><Star size={10} fill="#f6c90e" color="#f6c90e" /> {movie.rating}</div>
      </div>
      <div className="chov-c">
        <h4 className="cname">{movie.title}</h4>
        <div className="cacts">
          <button className="caplay" onClick={e => { e.stopPropagation(); onPlay && onPlay(movie); }}><Play size={13} fill="#000" /></button>
          <button className="caico" onClick={toggleList} style={{ transform: listAnim ? 'scale(1.4)' : 'scale(1)', transition: 'transform 0.25s cubic-bezier(.34,1.56,.64,1)' }}>
            {list ? <Check size={14} color="#46d369" /> : <Plus size={14} />}
          </button>
          <button className="caico" style={{ color: liked ? '#e50914' : 'inherit', transform: likeAnim ? 'scale(1.4)' : 'scale(1)', transition: 'transform 0.25s cubic-bezier(.34,1.56,.64,1)' }} onClick={toggleLike}><ThumbsUp size={13} fill={liked ? '#e50914' : 'none'} /></button>
          <button className="caico" onClick={e => { e.stopPropagation(); const src = getVideoForMovie(movie); const a = document.createElement('a'); a.href = src.url; a.download = (movie.title || 'movie') + '.mp4'; a.click(); showToast('⬇️ Download started!'); }} title="Download"><Download size={13} /></button>
          <button className="caico cainfo" onClick={e => { e.stopPropagation(); onOpen(movie); }}><Info size={13} /></button>
        </div>
        <div className="cmeta">
          <span className="cmt">{movie.match}%</span>
          <span className="cmc">{movie.maturity}</span>
          <span className="cmd"><Clock size={9} /> {movie.duration}</span>
        </div>
        <div className="ctags">{(movie.tags || []).slice(0, 3).join(" · ")}</div>
      </div>
    </div>
  );
}


/* ─── ROW ────────────────────────────────────────────────── */
function Row({ title, movies, onOpen, onPlay, rank }) {
  const ref = useRef(null);
  const [cl, setCl] = useState(false);
  const [cr, setCr] = useState(true);
  if (!movies || !movies.length) return null;
  const upd = () => { if (!ref.current) return; setCl(ref.current.scrollLeft > 0); setCr(ref.current.scrollLeft + ref.current.offsetWidth < ref.current.scrollWidth - 10); };
  const scroll = d => { ref.current.scrollBy({ left: d * 840, behavior: "smooth" }); setTimeout(upd, 420); };
  return (
    <section className="row">
      <div className="rowh"><h3 className="rowt">{title}</h3><button className="rowsa" onClick={() => { const e = new CustomEvent('seeAll', { detail: { title, movies } }); window.dispatchEvent(e); }}>See All →</button></div>
      <div className="roww">
        {cl && <button className="arr al" onClick={() => scroll(-1)}><ChevronLeft size={22} /></button>}
        <div className="rscr" ref={ref} onScroll={upd}>
          {movies.map((m, i) => {
            const pos = i === 0 ? 'first' : i === movies.length - 1 ? 'last' : 'mid';
            return <Card key={m.id + "-" + i} movie={m} onOpen={onOpen} onPlay={onPlay} rank={rank ? i + 1 : null} pos={pos} />;
          })}
        </div>
        {cr && <button className="arr ar" onClick={() => scroll(1)}><ChevronRight size={22} /></button>}
      </div>
    </section>
  );
}

/* ─── FREE VIDEO SOURCES (Creative Commons / Public Domain) ── */
const FREE_VIDEOS = {
  anime: { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', title: 'Big Buck Bunny', ep: 'Episode 1 — The Adventure Begins', duration: '9:56' },
  cartoon: { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', title: "Elephant's Dream", ep: 'Episode 1 — Into the Machine', duration: '10:54' },
  hollywood: { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', title: 'Sintel', ep: 'Full Movie', duration: '14:48' },
  kdrama: { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', title: 'Tears of Steel', ep: 'Short Film', duration: '12:14' },
  cdrama: { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', title: 'Tears of Steel', ep: 'Full Movie', duration: '12:14' },
  jdrama: { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', title: 'Sintel', ep: 'Episode 1', duration: '14:48' },
  wollywood: { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', title: 'Sample (HD)', ep: 'Episode 1', duration: '1:00' },
  default: { url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', title: 'Big Buck Bunny', ep: 'Episode 1', duration: '9:56' },
};

function getVideoForMovie(movie) {
  // If it's a TV show and has episode data, customize the title/id
  const isTv = movie?.type === 'tv' || movie?.media_type === 'tv';
  const ep = movie?.currentEpisode;
  
  const g = (movie?.genre || '').toLowerCase();
  const tags = (movie?.tags || []).map(t => t.toLowerCase()).join(' ');
  
  let base;
  if (tags.includes('anime') || g === 'anime') base = FREE_VIDEOS.anime;
  else if (tags.includes('cartoon') || g === 'cartoon') base = FREE_VIDEOS.cartoon;
  else if (tags.includes('k-drama') || g === 'kdrama') base = FREE_VIDEOS.kdrama;
  else if (tags.includes('j-drama') || g === 'jdrama') base = FREE_VIDEOS.jdrama;
  else if (tags.includes('c-drama') || g === 'cdrama') base = FREE_VIDEOS.cdrama;
  else if (tags.includes('wollywood') || g === 'wollywood') base = FREE_VIDEOS.wollywood;
  else if (tags.includes('hollywood') || g === 'hollywood') base = FREE_VIDEOS.hollywood;
  else base = FREE_VIDEOS.default;

  if (isTv && ep) {
    return {
      ...base,
      title: movie.title,
      ep: `Season ${movie.seasonNum} : Episode ${ep.episode_number} — ${ep.name}`,
      duration: ep.runtime || base.duration
    };
  }
  return base;
}

/* ─── VIDEO PLAYER ───────────────────────────────────────── */
function VideoPlayer({ movie, onClose }) {
  const isTV = movie.type === 'tv' || movie.episodes === 'TV Series' || (movie.episodes || '').includes('Season');
  const [selSeason, setSelSeason] = useState(movie.seasonNum || 1);
  const [selEp, setSelEp] = useState(movie.currentEpisode?.episode_number || 1);
  const [seasons, setSeasons] = useState([]);
  const [eps, setEps] = useState([]);
  const [embedIdx, setEmbedIdx] = useState(0);
  const [loadingEps, setLoadingEps] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (movie) { const u = getCurrentUser(); if (u) trackWatch(u, movie); }
  }, [movie]);

  // Fetch seasons list for TV
  useEffect(() => {
    if (!isTV) return;
    fetch(`/api/movies/tv/${movie.id}/seasons`)
      .then(r => r.json())
      .then(d => setSeasons(d.seasons || []))
      .catch(() => setSeasons([{ season_number: 1, name: 'Season 1', episode_count: 12 }]));
  }, [movie.id, isTV]);

  // Fetch episodes when season changes
  useEffect(() => {
    if (!isTV) return;
    setLoadingEps(true);
    fetch(`/api/movies/tv/${movie.id}/season/${selSeason}`)
      .then(r => r.json())
      .then(data => { setEps(Array.isArray(data) ? data : []); setLoadingEps(false); })
      .catch(() => { setEps([]); setLoadingEps(false); });
  }, [movie.id, selSeason, isTV]);

  // Build working embed URLs — tried and tested providers
  const getEmbeds = () => {
    const id = movie.id;
    if (isTV) {
      const s = selSeason, e = selEp;
      return [
        `https://vidsrc.net/embed/tv/${id}/${s}/${e}`,
        `https://autoembed.cc/tv/tmdb/${id}-${s}-${e}`,
        `https://moviesapi.club/tv/${id}-${s}-${e}`,
        `https://player.videasy.net/tv/${id}/${s}/${e}`,
        `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
      ];
    } else {
      return [
        `https://vidsrc.net/embed/movie/${id}`,
        `https://autoembed.cc/movie/tmdb/${id}`,
        `https://moviesapi.club/movie/${id}`,
        `https://player.videasy.net/movie/${id}`,
        `https://multiembed.mov/?video_id=${id}&tmdb=1`,
      ];
    }
  };

  const embeds = getEmbeds();
  const currentEmbed = embeds[embedIdx] || embeds[0];
  const epLabel = isTV ? `Season ${selSeason} · Ep ${selEp}` : 'Movie';

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 99999, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

      {/* ── TOP BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', background: '#111', borderBottom: '1px solid #222', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(1rem,2vw,1.5rem)', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.title}</h2>
            <span style={{ background: isTV ? '#6441a5' : '#e50914', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, letterSpacing: 1, flexShrink: 0 }}>{isTV ? 'SERIES' : 'MOVIE'}</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{epLabel} · {movie.year}</p>
        </div>

        {/* ── TV: show numbered server buttons ── */}
        {isTV && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {embeds.map((_, i) => (
              <button key={i} onClick={() => setEmbedIdx(i)}
                style={{ background: embedIdx === i ? '#6441a5' : 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', padding: '5px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                S{i + 1}
              </button>
            ))}
          </div>
        )}

        {/* ── MOVIE: only show a subtle "Not working?" fallback button ── */}
        {!isTV && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            {embedIdx > 0 && (
              <span style={{ fontSize: 11, color: '#888' }}>Server {embedIdx + 1} of {embeds.length}</span>
            )}
            {embedIdx < embeds.length - 1 && (
              <button onClick={() => setEmbedIdx(i => i + 1)}
                style={{ background: 'rgba(255,165,0,.15)', border: '1px solid rgba(255,165,0,.3)', color: '#ffa500', padding: '5px 14px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                ⚠ Not Working? Try Next
              </button>
            )}
            {embedIdx === embeds.length - 1 && (
              <button onClick={() => setEmbedIdx(0)}
                style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#aaa', padding: '5px 14px', borderRadius: 16, cursor: 'pointer', fontSize: 11 }}>
                ↺ Restart
              </button>
            )}
          </div>
        )}

        {isTV && (
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ background: sidebarOpen ? '#6441a5' : 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', padding: '5px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {sidebarOpen ? '⊟ Episodes' : '☰ Episodes'}
          </button>
        )}
      </div>

      {/* ── MAIN BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── VIDEO AREA ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <iframe
            key={`${currentEmbed}-${selSeason}-${selEp}`}
            src={currentEmbed}
            style={{ flex: 1, width: '100%', border: 'none', background: '#000' }}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
          />
        </div>

        {/* ── EPISODE SIDEBAR (TV only) ── */}
        {isTV && sidebarOpen && (
          <div style={{ width: 280, background: '#111', borderLeft: '1px solid #222', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

            {/* Season selector */}
            <div style={{ padding: '12px 14px', borderBottom: '1px solid #222', flexShrink: 0 }}>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Season</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {seasons.length > 0 ? seasons.map(s => (
                  <button key={s.season_number} onClick={() => { setSelSeason(s.season_number); setSelEp(1); }}
                    style={{ background: selSeason === s.season_number ? '#e50914' : 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', color: '#fff', padding: '4px 12px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    {s.season_number}
                  </button>
                )) : (
                  <button style={{ background: '#e50914', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>1</button>
                )}
              </div>
            </div>

            {/* Episodes list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {loadingEps ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80 }}>
                  <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,.1)', borderTop: '3px solid #e50914', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : eps.length === 0 ? (
                // Show numbered episode buttons if TMDB has no episode data
                Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setSelEp(n)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: selEp === n ? 'rgba(229,9,20,.18)' : 'transparent', border: 'none', borderLeft: selEp === n ? '3px solid #e50914' : '3px solid transparent', color: '#fff', padding: '10px 16px', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: selEp === n ? '#e50914' : 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{n}</span>
                    <span style={{ fontSize: 13, color: selEp === n ? '#fff' : '#aaa' }}>Episode {n}</span>
                    {selEp === n && <span style={{ marginLeft: 'auto', fontSize: 14 }}>▶</span>}
                  </button>
                ))
              ) : (
                eps.map(ep => (
                  <button key={ep.episode_number} onClick={() => setSelEp(ep.episode_number)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', background: selEp === ep.episode_number ? 'rgba(229,9,20,.18)' : 'transparent', border: 'none', borderLeft: selEp === ep.episode_number ? '3px solid #e50914' : '3px solid transparent', color: '#fff', padding: '10px 16px', cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: selEp === ep.episode_number ? '#e50914' : 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>{ep.episode_number}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: selEp === ep.episode_number ? '#fff' : '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ep.name || `Episode ${ep.episode_number}`}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#555' }}>{ep.runtime || '24 min'}</p>
                    </div>
                    {selEp === ep.episode_number && <span style={{ fontSize: 14, marginTop: 4, color: '#e50914' }}>▶</span>}
                  </button>
                ))
              )}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>
    </div>
  );
}


/* ─── MOVIE MODAL ────────────────────────────────────────── */
function MovieModal({ movie, onClose, onPlay }) {
  const [list, setList] = useState(false);
  const [liked, setLiked] = useState(false);
  const [sim, setSim] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selS, setSelS] = useState(1);
  const [showS, setShowS] = useState(false);
  const [eps, setEps] = useState([]);
  const [loadingEps, setLoadingEps] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [playingTrailer, setPlayingTrailer] = useState(false);

  const handlePlayTrailer = async () => {
    if (playingTrailer) { setPlayingTrailer(false); return; }
    try {
      const res = await fetch(`http://localhost:5000/api/movies/${movie.id}/trailer?type=${movie.type || 'movie'}`);
      const data = await res.json();
      if (data.youtubeKey) {
        setTrailerKey(data.youtubeKey);
        setPlayingTrailer(true);
      } else {
        alert('Trailer not found for this title.');
      }
    } catch { alert('Trailer not found for this title.'); }
  };

  useEffect(() => {
    // Check if it's a TV show or has episodes meta
    const isTv = movie.type === 'tv' || movie.media_type === 'tv' || String(movie.episodes || '').toLowerCase().includes('season');
    if (isTv) {
      getTvSeasons(movie.id).then(res => {
        setSeasons(res.seasons || []);
        if (res.seasons?.length > 0) setSelS(res.seasons[0].season_number);
      }).catch(() => { });
    }
  }, [movie.id]);

  useEffect(() => {
    const isTv = movie.type === 'tv' || movie.media_type === 'tv' || seasons.length > 0;
    if (isTv && selS) {
      setLoadingEps(true);
      getSeasonEpisodes(movie.id, selS).then(res => {
        setEps(res || []);
      }).catch(() => { }).finally(() => setLoadingEps(false));
    }
  }, [movie.id, selS, seasons.length]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    // Check list and like status
    authFetch(`/mylist/${movie.id}/check`).then(res => setList(res.inList)).catch(() => { });
    authFetch(`/likes/${movie.id}/check`).then(res => setLiked(res.liked)).catch(() => { });
    return () => { document.body.style.overflow = "" };
  }, [movie.id]);

  const toggleLike = async () => {
    const prev = liked;
    setLiked(!prev);
    if (!prev) showToast('❤️ Saved to Liked!');
    try {
      if (prev) {
        await authFetch(`/likes/${movie.id}`, { method: 'DELETE' });
      } else {
        await authFetch('/likes', {
          method: 'POST',
          body: JSON.stringify({
            movie_id: movie.id, movie_title: movie.title, movie_thumbnail: movie.thumbnail,
            movie_year: movie.year || movie.release_date || '', movie_genre: movie.genre || ''
          })
        });
      }
    } catch { setLiked(prev); showToast('⚠️ Sign in to like movies'); }
  };

  useEffect(() => {
    apiFetch('/movies/trending').then(ms => setSim(ms.filter(m => m.id !== movie.id).slice(0, 3))).catch(() => { });
  }, [movie.id]);

  const toggleList = async () => {
    const prev = list;
    setList(!prev);
    if (!prev) showToast('➕ Added to Your Watchlist.');
    try {
      if (prev) {
        await authFetch(`/mylist/${movie.id}`, { method: 'DELETE' });
      } else {
        const body = JSON.stringify({
          movie_id: movie.id, movie_title: movie.title, movie_thumbnail: movie.thumbnail,
          movie_year: movie.year || movie.release_date || '', movie_rating: movie.rating || ''
        });
        await authFetch('/mylist', { method: 'POST', body });
        await authFetch('/downloads', { method: 'POST', body }).catch(() => { });
        const u = getCurrentUser();
        if (u) trackDownload(u, movie);
      }
    } catch (err) {
      setList(prev);
      console.warn('Login to manage list');
      showToast('⚠️ Sign in to add to list and download.');
    }
  };

  return (
    <div className="ov" onClick={onClose}>
      <div className="mbox" onClick={e => e.stopPropagation()}>
        <button className="mcls" onClick={onClose}><X size={18} /></button>
        <div className="mhi">
          {playingTrailer && trailerKey ? (
            <iframe width="100%" style={{ border: 'none', position: 'absolute', top: 0, left: 0, right: 0, height: 'calc(100% - 80px)', zIndex: 0 }} src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&disablekb=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3`} allow="autoplay; encrypted-media" allowFullScreen></iframe>
          ) : (
            <img src={movie.backdrop || movie.thumbnail} alt={movie.title} />
          )}
          <div className="mhf" style={{ zIndex: 1, pointerEvents: 'none' }} />
          <div className="mhc" style={{ zIndex: 2, pointerEvents: 'none' }}>
           <h2 className="mht" style={{ pointerEvents: 'auto', opacity: playingTrailer ? 0 : 1, transition: 'opacity 0.3s' }}>{movie.title}</h2>
           <div className="mha" style={{ pointerEvents: 'auto' }}>
             <button className="bplay sm" onClick={() => { onPlay(movie); onClose(); }}><Play fill="#000" size={16} /> Play</button>
             <button className="bplay sm" style={{ background: 'rgba(109, 109, 110, 0.7)', color: 'white' }} onClick={handlePlayTrailer}>
               {playingTrailer ? <X size={16} /> : <Film size={16} />} {playingTrailer ? 'Close Trailer' : 'Trailer'}
             </button>
            <button className={"bic" + (list ? " act" : "")} onClick={toggleList}>{list ? <Check size={16} color="#46d369" /> : <Plus size={16} />}</button>
            <button className={"bic" + (liked ? " lk" : "")} onClick={toggleLike}><ThumbsUp size={16} fill={liked ? "#e50914" : "none"} /></button>
            <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
              <button className="bic" onClick={() => { 
                const u = getCurrentUser();
                if (u) {
                  showToast('💾 Saving to Downloads...');
                  const body = JSON.stringify({
                    movie_id: movie.id, movie_title: movie.title, movie_thumbnail: movie.thumbnail,
                    movie_year: movie.year || movie.release_date || '', movie_rating: movie.rating || ''
                  });
                  authFetch('/downloads', { method: 'POST', body }).then(() => {
                    showToast('💾 Saved to Internal Downloads!');
                    trackDownload(u, movie);
                  }).catch(() => showToast('❌ Error saving.'));
                } else {
                  alert('Please sign in to save offline.');
                }
              }} title="Save to Site"><Save size={16} /></button>
              
              <button className="bic" onClick={() => { 
                const src = getVideoForMovie(movie); 
                const a = document.createElement('a'); 
                a.href = src.url; 
                a.download = (movie.title || 'movie') + '.mp4'; 
                a.click(); 
                showToast('🚀 Export to Device started!'); 
              }} title="Export to Device"><Download size={16} /></button>
            </div>
            <button className="bic" onClick={() => { navigator.clipboard.writeText(window.location.href + '?movie=' + movie.id).then(() => showToast('🔗 Link copied!')); }} title="Share"><Share2 size={14} /></button>
          </div>
        </div></div>
        <div className="mbg">
          <div className="mbl">
            <div className="mpls">
              <span className="pl g">{movie.match}% Match</span><span className="pl">{movie.year}</span>
              <span className="pl r">{movie.maturity}</span><span className="pl">{movie.episodes}</span><span className="pl b">HD</span>
            </div>
            <p className="mdes">{movie.desc}</p>

            {/* EPISODES SECTION */}
            {movie.type === 'tv' && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h4 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 18, fontWeight: 700, margin: 0 }}>Episodes</h4>
                  {seasons.length > 1 && (
                    <div style={{ position: 'relative' }}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setShowS(s => !s); }}
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}
                      >
                        {seasons.find(s => s.season_number === selS)?.name || `Season ${selS}`} <ChevronDown size={14} />
                      </button>
                      {showS && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#181818', border: '1px solid #333', borderRadius: 4, zIndex: 10, width: 140, boxShadow: '0 8px 16px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                          {seasons.map(s => (
                            <div key={s.id} 
                              onClick={() => { setSelS(s.season_number); setShowS(false); }}
                              style={{ padding: '10px 16px', fontSize: 13, cursor: 'pointer', background: s.season_number === selS ? '#333' : 'transparent', color: s.season_number === selS ? '#fff' : '#b3b3b3' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#333'}
                              onMouseLeave={e => { if (s.season_number !== selS) e.currentTarget.style.background = 'transparent'; }}
                            >
                              {s.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {loadingEps ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', opacity: 0.5 }}>Loading episodes...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {eps.map((e, idx) => (
                      <div key={e.id} 
                        onClick={() => { onPlay({...movie, currentEpisode: e, seasonNum: selS}); onClose(); }}
                        className="ep-row"
                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 12px', borderRadius: 4, cursor: 'pointer', transition: 'background 0.2s', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', width: 24, textAlign: 'center' }}>{idx + 1}</span>
                        <div style={{ position: 'relative', width: 130, height: 74, flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
                          <img src={e.still || movie.thumbnail} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', opacity: 0 }} 
                            onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                            <Play fill="#fff" size={24} />
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <h5 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{e.name}</h5>
                            <span style={{ fontSize: 13, opacity: 0.6 }}>{e.runtime}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{e.overview}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mbr">
            {movie.cast && <p><span className="lbl">Cast:</span> {movie.cast}</p>}
            <p><span className="lbl">Genres:</span> {(movie.tags || []).join(", ")}</p>
            <p><span className="lbl">Duration:</span> {movie.duration}</p>
            <p><span className="lbl">Rating:</span> <Star size={11} fill="#f6c90e" color="#f6c90e" style={{ verticalAlign: "middle" }} /> {movie.rating}/10</p>
          </div>
        </div>
        {sim.length > 0 && <div className="msim"><h4 className="msimh">MORE LIKE THIS</h4><div className="msimg">{sim.map(m => <div key={m.id} className="msimc" onClick={() => { onClose(); onOpen && onOpen(m); }}><img src={m.thumbnail} alt={m.title} /><p className="msimn">{m.title}</p><p className="msimm">{m.match}% Match</p></div>)}</div></div>}
      </div>
    </div>
  );
}



/* ─── PROFILE PAGE (FULL SCREEN) ─────────────────────────── */
function ProfileModal({ onClose }) {
  const [tab, setTab] = useState('activity'); // activity | watchlist | likes | edit
  const [name, setName] = useState('Nishant');
  const [activity, setActivity] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [likes, setLikes] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser() || { name: 'User', email: 'user@rimuru.demo' };

  const loadData = async () => {
    setLoading(true);
    try {
      const [act, list, lks, dls] = await Promise.all([
        authFetch('/profile/activity'),
        authFetch('/mylist'),
        authFetch('/likes'),
        authFetch('/downloads')
      ]);
      setActivity(Array.isArray(act) ? act : []);
      setWatchlist(Array.isArray(list) ? list : []);
      setLikes(Array.isArray(lks) ? lks : []);
      setDownloads(Array.isArray(dls) ? dls : []);
    } catch (e) { 
      console.error('Profile load error', e); 
      showToast('Error loading profile data');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const watchCount = activity.length;
  const lastSeen = activity[0]?.relTime || '—';

  const groupByCategory = (items) => {
    const groups = { Movies: [], Drama: [], Anime: [], Cartoon: [] };
    items.forEach(item => {
      const g = (item.movie_genre || '').toLowerCase();
      const title = (item.movie_title || '').toLowerCase();
      
      // Better classification
      if (g.includes('anime') || title.includes('anime')) groups.Anime.push(item);
      else if (g.includes('cartoon') || title.includes('cartoon')) groups.Cartoon.push(item);
      else if (g.includes('drama') || g.includes('tv') || g.includes('series')) groups.Drama.push(item);
      else groups.Movies.push(item);
    });
    return groups;
  };

  const tabBtn = (id, label, icon) => (
    <button onClick={() => setTab(id)} style={{
      background: 'none', border: 'none', color: tab === id ? '#fff' : 'rgba(255,255,255,0.45)',
      fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: tab === id ? 700 : 400,
      cursor: 'pointer', padding: '12px 0', marginRight: 24,
      borderBottom: tab === id ? '2px solid #e50914' : '2px solid transparent',
      transition: 'all 0.22s', display: 'flex', alignItems: 'center', gap: 6,
    }}>{icon} {label}</button>
  );

  const downloadBtn = tabBtn('downloads', 'Downloads', <Download size={15} />);

  const renderGrid = (items) => {
    const groups = groupByCategory(items);
    const hasAny = Object.values(groups).some(g => g.length > 0);
    
    if (!hasAny) return (
      <div style={{ textAlign: 'center', padding: '80px 0', opacity: 0.3 }}>
        <Film size={48} style={{ marginBottom: 12 }} />
        <p>Nothing saved here yet</p>
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {Object.entries(groups).map(([cat, list]) => list.length > 0 && (
          <div key={cat}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, margin: 0, letterSpacing: 1 }}>{cat}</h3>
              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 10, opacity: 0.5 }}>{list.length}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
              {list.map(m => (
                <div key={m.id} style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 10, overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <img src={m.movie_thumbnail} alt={m.movie_title} style={{ width: '100%', height: 90, objectFit: 'cover' }} />
                  <div style={{ padding: 10 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.movie_title}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, opacity: 0.4 }}>{m.movie_year}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50000, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', overflowY: 'auto', animation: 'fdin .22s ease' }}>
      <button onClick={onClose} style={{ position: 'fixed', top: 20, right: 24, zIndex: 99, background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
      
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ position: 'relative', height: 200, background: 'linear-gradient(135deg, #e50914 0%, #141414 100%)', borderRadius: '0 0 32px 32px', overflow: 'hidden', marginBottom: 60 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: 40, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" style={{ width: 120, height: 120, borderRadius: 20, border: '4px solid #000', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }} alt="av" />
            <div style={{ paddingBottom: 45 }}>
              <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 44, margin: 0, lineHeight: 1 }}>{user.name}</h1>
              <p style={{ margin: '5px 0 0', opacity: 0.6, fontSize: 14 }}>{user.email} · <span style={{ color: '#e50914', fontWeight: 700 }}>PREMIUM</span></p>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Activity', value: watchCount, icon: '📺', color: '#e50914' },
            { label: 'Saved', value: watchlist.length, icon: '🔖', color: '#3b82f6' },
            { label: 'Liked', value: likes.length, icon: '❤️', color: '#ff4d4d' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, opacity: 0.4, textTransform: 'uppercase', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 30 }}>
          {tabBtn('activity', 'Recent Activity', <Activity size={15} />)}
          {tabBtn('watchlist', 'My List', <Plus size={15} />)}
          {tabBtn('likes', 'Liked', <ThumbsUp size={15} />)}
          {downloadBtn}
          <div style={{ flex: 1 }} />
          {tabBtn('edit', 'Edit Profile', <Settings size={15} />)}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(229,9,20,0.2)', borderTopColor: '#e50914', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : (
          <>
            {tab === 'activity' && renderGrid(activity)}
            {tab === 'watchlist' && renderGrid(watchlist)}
            {tab === 'likes' && renderGrid(likes)}
            {tab === 'downloads' && renderGrid(downloads)}
            {tab === 'edit' && (
              <div style={{ maxWidth: 400 }}>
                <label style={{ display: 'block', fontSize: 12, opacity: 0.4, marginBottom: 8 }}>Display Name</label>
                <input style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 14px', color: '#fff', marginBottom: 20 }} value={name} onChange={e => setName(e.target.value)} />
                <label style={{ display: 'block', fontSize: 12, opacity: 0.4, marginBottom: 8 }}>Email</label>
                <input style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 14px', color: '#fff', marginBottom: 20, opacity: 0.5 }} value={user.email} readOnly />
                <button className="bsv" style={{ width: '100%' }} onClick={() => showToast('Profile settings saved!')}>Save Profile</button>
              </div>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


/* ─── MY LIST MODAL (REAL API) ───────────────────────────── */
function MyListModal({ onClose, onPlay }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); authFetch('/mylist').then(setItems).catch(() => { }).finally(() => setLoading(false)); };
  useEffect(load, []);
  const remove = id => { authFetch(`/mylist/${id}`, { method: 'DELETE' }).catch(() => { }); setItems(p => p.filter(m => String(m.movie_id) !== String(id))); };
  return (
    <div className="ov" onClick={onClose} style={{ zIndex: 50000 }}>
      <div className="sbox wide" onClick={e => e.stopPropagation()}>
        <button className="mcls" onClick={onClose}><X size={18} /></button>
        <h2 className="stit">Watchlist</h2>
        <p style={{ color: 'rgba(255,255,255,.45)', fontSize: 13, marginBottom: 20 }}>{items.length} title{items.length !== 1 ? 's' : ''} saved</p>
        {loading ? <div style={{ textAlign: 'center', padding: 40, opacity: .4 }}>Loading...</div>
          : items.length === 0
            ? <div style={{ textAlign: 'center', padding: 40, opacity: .35, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Bookmark size={48} /><p>No movies saved yet</p>
              <p style={{ fontSize: 12 }}>Click the + button on any movie to add it here</p>
            </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                  <img src={m.movie_thumbnail || 'https://via.placeholder.com/76x46/141414/e50914?text=?'} alt={m.movie_title}
                    style={{ width: 76, height: 46, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{m.movie_title}</p>
                    <p style={{ fontSize: 11, opacity: .45 }}>{m.movie_year} · Saved {m.added_at?.slice(0, 10)}</p>
                  </div>
                  {onPlay && <button className="bplay sm" onClick={() => { onPlay({ id: m.movie_id, title: m.movie_title, thumbnail: m.movie_thumbnail }); onClose(); }}><Play size={12} fill="#000" /></button>}
                  <button onClick={() => remove(m.movie_id)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.5)', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}

/* ─── DOWNLOADS MODAL (REAL API) ────────────────────────── */
function DownloadsModal({ onClose, onPlay }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = () => { setLoading(true); authFetch('/downloads').then(setItems).catch(() => { }).finally(() => setLoading(false)); };
  useEffect(load, []);
  const remove = id => { authFetch(`/downloads/${id}`, { method: 'DELETE' }).catch(() => { }); setItems(p => p.filter(m => String(m.movie_id) !== String(id))); };
  return (
    <div className="ov" onClick={onClose} style={{ zIndex: 50000 }}>
      <div className="sbox" onClick={e => e.stopPropagation()}>
        <button className="mcls" onClick={onClose}><X size={18} /></button>
        <h2 className="stit">Downloads</h2>
        {loading ? <div style={{ textAlign: 'center', padding: 40, opacity: .4 }}>Loading...</div>
          : items.length === 0
            ? <div style={{ textAlign: 'center', padding: 40, opacity: .35, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Download size={48} /><p>No downloads yet</p>
              <p style={{ fontSize: 12 }}>Open any movie and tap Download to save it here</p>
            </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {items.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                  {m.movie_thumbnail
                    ? <img src={m.movie_thumbnail} alt={m.movie_title} style={{ width: 68, height: 44, objectFit: 'cover', borderRadius: 4 }} />
                    : <div style={{ width: 68, height: 44, background: 'rgba(229,9,20,.15)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={20} color="#e50914" /></div>
                  }
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{m.movie_title}</p>
                    <p style={{ fontSize: 11, opacity: .45 }}>{m.movie_year} · Downloaded {m.downloaded_at?.slice(0, 10)}</p>
                  </div>
                  <span style={{ fontSize: 11, color: '#46d369', fontWeight: 700 }}>READY</span>
                  <button onClick={() => remove(m.movie_id)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.5)', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
        }
        <p style={{ marginTop: 18, fontSize: 11, opacity: .35, textAlign: 'center' }}>{items.length} title{items.length !== 1 ? 's' : ''} available offline</p>
      </div>
    </div>
  );
}




/* ─── SETTINGS MODAL ─────────────────────────────────────── */
function SettingsModal({ onClose }) {
  const [ap, setAp] = useState(true);
  const [hd, setHd] = useState(true);
  const [nf, setNf] = useState(true);
  const Tog = ({ v, s }) => <div className={"tog" + (v ? " ton" : "")} onClick={() => s(x => !x)}><div className="tok" /></div>;
  const user = JSON.parse(localStorage.getItem('netflix_user') || '{"name": "User", "email": "user@rimuru.demo"}');
  return (
    <div className="ov" onClick={onClose} style={{ zIndex: 50000 }}>
      <div className="sbox" onClick={e => e.stopPropagation()}>
        <button className="mcls" onClick={onClose}><X size={18} /></button>
        <h2 className="stit">Account Settings</h2>
        <div className="srows">
          {[{ l: "Email", v: user.email || "user@rimuru.demo" }, { l: "Plan", v: "4K HDR · Premium" }, { l: "Next Billing", v: "April 1, 2025" }].map(r => (
            <div key={r.l} className="srow"><span className="slbl">{r.l}</span><span style={{ fontWeight: 600, fontSize: 13 }}>{r.v}</span></div>
          ))}
        </div>

        <h4 style={{ fontSize: 11, letterSpacing: 1, opacity: .45, margin: "22px 0 12px" }}>PREFERENCES</h4>
        <div className="srows">
          <div className="srow"><span className="slbl">Autoplay Previews</span><Tog v={ap} s={setAp} /></div>
          <div className="srow"><span className="slbl">High Definition</span><Tog v={hd} s={setHd} /></div>
          <div className="srow"><span className="slbl">Notifications</span><Tog v={nf} s={setNf} /></div>
        </div>
        <button className="bsv" style={{ width: "100%", marginTop: 22 }} onClick={onClose}>Save Settings</button>

      </div>
    </div>
  );
}


/* ─── SEARCH PAGE ────────────────────────────────────────── */
function SearchPage({ query, results, onOpen, aiResults, aiMode }) {
  return (
    <div style={{ padding: "0 4%" }}>
      <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "clamp(1.8rem,4vw,2.6rem)", marginBottom: 24 }}>
        Results for <span style={{ color: "rgba(255,255,255,.4)" }}>&ldquo;{query}&rdquo;</span>
        {aiMode && <span style={{ marginLeft: 12, fontSize: 14, background: 'rgba(229,9,20,0.15)', color: '#e50914', border: '1px solid rgba(229,9,20,0.3)', padding: '3px 12px', borderRadius: 20, fontFamily: "'DM Sans',sans-serif", fontWeight: 600, verticalAlign: 'middle' }}>✨ AI Mode</span>}
      </h2>
      {aiMode && aiResults && aiResults.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, opacity: 0.5, marginBottom: 14 }}>
            <span style={{ background: 'linear-gradient(90deg,#e50914,#ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>✨ AI PICKS</span>
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8, marginBottom: 24 }}>
            {aiResults.map(m => <div key={m.id} style={{ position: 'relative' }}><div style={{ position: 'absolute', top: 8, left: 8, zIndex: 5, background: 'linear-gradient(135deg,#e50914,#ff6b6b)', borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>✨ AI</div><Card movie={m} onOpen={onOpen} /></div>)}
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 24 }} />
          <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, opacity: 0.5, marginBottom: 14 }}>ALL RESULTS</h3>
        </div>
      )}
      {results.length === 0 && (!aiMode || !aiResults || aiResults.length === 0)
        ? <div style={{ textAlign: "center", padding: "80px 0", opacity: .3, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}><Film size={54} /><p>No titles found</p></div>
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>{results.map(m => <Card key={m.id} movie={m} onOpen={onOpen} />)}</div>
      }
    </div>
  );
}

/* ─── MAIN HOME PAGE ─────────────────────────────────────── */
export default function HomePage({ onLogout }) {
  const { rows, loading, error } = useMovieData();

  const [toast, setToast] = useState(null);
  useEffect(() => {
    const handler = (e) => { setToast(e.detail); setTimeout(() => setToast(null), 3000); };
    toastEvent.addEventListener('toast', handler);
    return () => toastEvent.removeEventListener('toast', handler);
  }, []);

  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [searchRes, setSearchRes] = useState([]);
  const [aiRes, setAiRes] = useState([]);
  const [aiSearchMode, setAiSearchMode] = useState(false);
  const [searching, setSearching] = useState(false);
  const [cat, setCat] = useState("Home");
  const [activeGenre, setActiveGenre] = useState(null);
  const [modal, setModal] = useState(null);
  const [videoMovie, setVideoMovie] = useState(null);
  const [settingsModal, setSettingsModal] = useState(null);
  const [seeAll, setSeeAll] = useState(null); // { title, movies }
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroKey, setHeroKey] = useState(0);
  const timerRef = useRef(null);
  const searchT = useRef(null);

  useEffect(() => { const fn = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn); }, []);
  useEffect(() => { const fn = (e) => setSeeAll(e.detail); window.addEventListener('seeAll', fn); return () => window.removeEventListener('seeAll', fn); }, []);
  const advance = useCallback(() => { setHeroIdx(i => (i + 1) % Math.min(rows.trending.length || 1, 5)); setHeroKey(k => k + 1); }, [rows.trending.length]);
  useEffect(() => { timerRef.current = setInterval(advance, 8000); return () => clearInterval(timerRef.current); }, [advance]);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    clearTimeout(searchT.current);
    if (!q.trim()) { setSearchRes([]); setAiRes([]); setSearching(false); return; }
    setSearching(true);
    searchT.current = setTimeout(() => {
      const standard = apiFetch('/movies/search?q=' + encodeURIComponent(q)).then(setSearchRes).catch(() => setSearchRes([]));
      const ai = aiSearchMode
        ? apiFetch('/ai/recommend?q=' + encodeURIComponent(q)).then(setAiRes).catch(() => setAiRes([]))
        : Promise.resolve();
      Promise.all([standard, ai]).finally(() => setSearching(false));
    }, 400);
  }, [aiSearchMode]);

  const km = { Anime: "anime", Cartoon: "cartoon", Hollywood: "hollywood", Wollywood: "wollywood", "K-Drama": "kdrama", "C-Drama": "cdrama", "J-Drama": "jdrama" };
  const keyToCat = { anime: "Anime", cartoon: "Cartoon", hollywood: "Hollywood", wollywood: "Wollywood", kdrama: "K-Drama", cdrama: "C-Drama", jdrama: "J-Drama" };
  const handleCat = c => {
    setCat(c);
    setActiveGenre(km[c] || null);  // sync genre strip highlight with navbar
    setHeroIdx(0); setHeroKey(k => k + 1);
  };

  // Pick hero source based on active category / genre

  const heroSource = activeGenre
    ? (rows[activeGenre] || [])
    : cat !== "Home"
      ? (rows[km[cat]] || [])
      : (rows.trending && rows.trending.length > 0)
        ? rows.trending
        : (Object.values(rows).find(list => Array.isArray(list) && list.length > 0) || []);

  const heroMovie = heroSource[heroIdx % Math.max(heroSource.length, 1)] || null;
  const getRows = () => {
    if (activeGenre) { 
      const g = GENRES.find(x => x.key === activeGenre); 
      const allMovies = rows[activeGenre] || [];
      return [
        { title: "🆕 Latest " + g.label, movies: allMovies.slice(0, 20) },
        { title: "⭐ Highly Rated", movies: [...allMovies].sort((a,b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20) },
        { title: "✨ More to Explore", movies: [...allMovies].slice(20, 60).sort(() => Math.random() - .5) },
      ]; 
    }
    
    if (cat === "Home") return [
      { title: "🔥 Trending Now", movies: rows.trending, rank: true },
      { title: "🎬 Hollywood", movies: rows.hollywood },
      { title: "🗡️ Anime", movies: rows.anime },
      { title: "🌸 K-Dramas", movies: rows.kdrama },
      { title: "🎨 Cartoons", movies: rows.cartoon },
      { title: "🎭 Wollywood", movies: rows.wollywood },
      { title: "🐉 C-Dramas", movies: rows.cdrama },
      { title: "⛩️ J-Dramas", movies: rows.jdrama },
      { title: "✨ Top Picks", movies: rows.picks },
    ];

    const categoryLabel = cat;
    const categoryKey = km[cat];
    const categoryMovies = rows[categoryKey] || [];
    return [
      { title: "🆕 Latest " + categoryLabel, movies: categoryMovies.slice(0, 20) },
      { title: "⭐ Top Rated in " + categoryLabel, movies: [...categoryMovies].sort((a,b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20) },
      { title: "🎞️ Browse All", movies: [...categoryMovies].slice(20, 100) },
    ];
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="root">
        <Aurora /><Particles />
        <Navbar scrolled={scrolled} category={cat} setCategory={handleCat} onSearch={handleSearch} setActiveModal={setSettingsModal} onLogout={onLogout} trending={rows.trending || []} anime={rows.anime || []} onMovieSelect={setModal} />
        {query.trim() ? (
          <div style={{ paddingTop: 100, position: "relative", zIndex: 2 }}>
            {searching
              ? <div style={{ textAlign: "center", padding: "80px 0", color: "rgba(255,255,255,.4)" }}><Film size={40} /><p style={{ marginTop: 8 }}>Searching...</p></div>
              : <SearchPage query={query} results={searchRes} onOpen={setModal} aiResults={aiRes} aiMode={aiSearchMode} />
            }
          </div>
        ) : (
          <>
            {loading ? (
              <div className="hero" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0d0d0d,#1a0a0a)" }}>
                <div style={{ textAlign: "center", color: "rgba(255,255,255,.4)" }}><Film size={64} /><p style={{ marginTop: 12, fontSize: 14, fontFamily: "DM Sans,sans-serif" }}>Loading movies...</p></div>
              </div>
            ) : error ? (
              <div className="hero" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
                <div style={{ textAlign: "center", color: "rgba(255,255,255,.6)", padding: "20px" }}>
                  <Users size={64} color="#e50914" />
                  <h2 style={{ marginTop: 20 }}>{error}</h2>
                  <p style={{ marginTop: 10, opacity: 0.7 }}>Please check the `server/.env` file and ensure the `TMDB_BEARER_TOKEN` is correct.</p>
                  <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => window.location.reload()}>Retry Connection</button>
                </div>
              </div>
            ) : heroMovie ? (
              <Hero key={heroKey} movie={heroMovie} onOpen={setModal} onPlay={setVideoMovie} heroIdx={heroIdx} heroCount={Math.min(heroSource.length, 5)} onDotClick={i => { setHeroIdx(i); setHeroKey(k => k + 1); clearInterval(timerRef.current); timerRef.current = setInterval(advance, 8000); }} />
            ) : (
              <div style={{ height: "40vh", minHeight: 140, paddingTop: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)" }}>
                <p style={{ opacity: 0.4, fontStyle: "italic" }}>Loading previous releases...</p>
              </div>
            )}

            <div style={{ position: "relative", zIndex: 2 }}>
              <GenreStrip active={activeGenre} setActive={key => {
                setActiveGenre(key);
                setCat(key ? keyToCat[key] : 'Home');  // sync navbar highlight with genre strip
                setHeroIdx(0); setHeroKey(k => k + 1);
              }} />
              <main style={{ paddingBottom: 80 }}>{getRows().map((r, i) => <Row key={i} title={r.title} movies={r.movies} onOpen={setModal} onPlay={setVideoMovie} rank={r.rank} />)}</main>
            </div>
          </>
        )}
        {videoMovie && <VideoPlayer movie={videoMovie} onClose={() => setVideoMovie(null)} />}
        {modal && <MovieModal movie={modal} onClose={() => setModal(null)} onPlay={setVideoMovie} />}
        {settingsModal === "profile" && <ProfileModal onClose={() => setSettingsModal(null)} />}
        {settingsModal === "mylist" && <MyListModal onClose={() => setSettingsModal(null)} onPlay={setVideoMovie} />}
        {settingsModal === "downloads" && <DownloadsModal onClose={() => setSettingsModal(null)} onPlay={setVideoMovie} />}
        {settingsModal === "settings" && <SettingsModal onClose={() => setSettingsModal(null)} />}
        {seeAll && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(14px)', overflowY: 'auto', animation: 'fdin .22s ease' }} onClick={() => setSeeAll(null)}>
            <button onClick={() => setSeeAll(null)} style={{ position: 'fixed', top: 20, right: 24, zIndex: 99, background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '90px 24px 60px' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(1.8rem,4vw,2.6rem)', marginBottom: 24 }}>{seeAll.title}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10 }}>
                {seeAll.movies.map(m => <Card key={m.id} movie={m} onOpen={setModal} onPlay={setVideoMovie} />)}
              </div>
            </div>
          </div>
        )}
        <AiChat onMovieSelect={setModal} userName={getCurrentUser()?.name || 'User'} />

        <Footer />

        {toast && (
          <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: '#008000', color: '#fff', padding: '14px 28px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10, zIndex: 99999, fontWeight: 500, animation: 'hup .3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            <div style={{ background: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={16} color="#008000" />
            </div>
            Success! {toast}
          </div>
        )}
      </div>
    </>
  );
}


/* ─── FOOTER ─────────────────────────────────────────────────── */
function Footer() {
  const links = [
     ['FAQ', 'Help Centre', 'Account', 'Media Centre'],
    ['Investor Relations', 'Jobs', 'Ways to Watch', 'Terms of Use'],
    ['Privacy', 'Cookie Preferences', 'Corporate Info', 'Contact Us'],
    ['Speed Test', 'Legal Notices', 'Only on Rimuru', 'Gift Cards'],
  ];
  return (
    <footer className="footer">
      <div className="footer-grid">
        {links.map((col, i) => (
          <div key={i} className="footer-col">
            {col.map(link => <a key={link} href="#">{link}</a>)}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <div className="footer-logo" style={{ background: 'linear-gradient(to right, #e50914, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>RIMURU</div>
        <p>© 2026 Rimuru. All rights reserved.</p>
        <p style={{marginTop: 4}}>This is a personalized streaming platform experience.</p>
      </div>
    </footer>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
:root{--red:#e50914;--green:#46d369;--blue:#3b82f6;--yel:#f6c90e;--bg:#090909;--s1:#141414;--s2:#1c1c1c;--bdr:rgba(255,255,255,.08);--cw:220px;--ch:124px;}
html{scroll-behavior:smooth;}
body{background:var(--bg);color:#fff;font-family:'DM Sans',sans-serif;overflow-x:hidden;}
.root{position:relative;min-height:100vh;}
@keyframes a1{0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(80px,-60px)scale(1.15)}}
@keyframes a2{0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(-90px,70px)scale(1.2)}}
@keyframes a3{0%,100%{transform:translate(0,0)scale(1)}50%{transform:translate(50px,50px)scale(.9)}}
.au1,.au2,.au3{position:absolute;border-radius:50%;filter:blur(90px);opacity:.11;pointer-events:none;}
.au1{width:580px;height:580px;background:radial-gradient(circle,#e50914,transparent);top:-80px;left:-80px;animation:a1 18s ease-in-out infinite;}
.au2{width:480px;height:480px;background:radial-gradient(circle,#3b82f6,transparent);top:280px;right:-120px;animation:a2 22s ease-in-out infinite;}
.au3{width:380px;height:380px;background:radial-gradient(circle,#805ad5,transparent);bottom:0;left:38%;animation:a3 15s ease-in-out infinite;}
.nb{position:fixed;top:0;left:0;right:0;z-index:9999;display:flex;align-items:center;justify-content:space-between;padding:0 4%;height:62px;transition:background .4s,border-color .4s;border-bottom:1px solid transparent;}
.nb.sc{background:rgba(9,9,9,.88);backdrop-filter:blur(32px);border-color:var(--bdr);box-shadow:0 1px 0 rgba(229,9,20,.12),0 4px 30px rgba(0,0,0,.5);}
.nb:not(.sc){background:linear-gradient(to bottom,rgba(0,0,0,.8),transparent);}
.nb-l{display:flex;align-items:center;gap:24px;}
.logo{display:flex;align-items:baseline;cursor:pointer;user-select:none;}
.ln{font-family:'Bebas Neue',sans-serif;font-size:30px;color:var(--red);letter-spacing:-1px;}
.le{font-family:'Bebas Neue',sans-serif;font-size:26px;color:#fff;letter-spacing:1px;}
.nl{display:flex;gap:4px;list-style:none;}
.nl li{position:relative;font-size:13px;font-weight:500;cursor:pointer;color:rgba(255,255,255,.65);padding:7px 9px;transition:color .2s;white-space:nowrap;}
.nl li:hover,.nl li.act{color:#fff;}
.nul{position:absolute;bottom:2px;left:9px;right:9px;height:2px;background:var(--red);border-radius:2px;transform:scaleX(0);transform-origin:left;transition:transform .28s cubic-bezier(.4,0,.2,1);pointer-events:none;}
.nul.vis{transform:scaleX(1);}
.nb-r{display:flex;align-items:center;gap:6px;}
.ib{background:none;border:none;color:rgba(255,255,255,.78);cursor:pointer;padding:8px;border-radius:50%;display:flex;transition:color .2s,background .2s;}
.ib:hover{color:#fff;background:rgba(255,255,255,.09);}
.sw{display:flex;align-items:center;border:1px solid transparent;border-radius:4px;overflow:hidden;transition:all .3s;}
.sw.op{background:rgba(0,0,0,.9);border-color:rgba(255,255,255,.28);padding-right:6px;}
.si{border:none;background:transparent;color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;width:0;transition:width .3s;padding:0;}
.sw.op .si{width:180px;padding:4px 6px;}
.drop-a{position:relative;}
.nb2{position:relative;}
.nd{position:absolute;top:8px;right:8px;width:6px;height:6px;background:var(--red);border-radius:50%;border:1px solid var(--bg);}
.dd{position:absolute;right:0;top:calc(100% + 10px);background:rgba(12,12,12,.98);border:1px solid var(--bdr);border-radius:8px;backdrop-filter:blur(26px);z-index:10000;animation:fdd .2s ease;}
@keyframes fdd{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.ndd{min-width:290px;padding:0;}
.ddh{padding:13px 18px;border-bottom:1px solid var(--bdr);font-size:11px;letter-spacing:1.2px;opacity:.5;}
.ni{display:flex;gap:12px;align-items:center;padding:12px 18px;cursor:pointer;transition:background .15s;}
.ni:hover{background:rgba(255,255,255,.04);}
.nth{width:50px;height:34px;object-fit:cover;border-radius:3px;flex-shrink:0;}
.ntx{font-size:12.5px;line-height:1.4;}
.ntm{font-size:10.5px;opacity:.4;margin-top:2px;}
.pb{display:flex;align-items:center;gap:7px;background:none;border:none;color:#fff;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background .2s;}
.pb:hover{background:rgba(255,255,255,.07);}
.av{width:30px;height:30px;border-radius:4px;object-fit:cover;}
.an{font-size:13px;font-weight:500;}
.pdd{min-width:210px;padding:6px 0;}
.ph{display:flex;align-items:center;gap:12px;padding:14px 18px 10px;border-bottom:1px solid var(--bdr);margin-bottom:4px;}
.phn{font-size:13px;font-weight:600;}
.php{font-size:11px;opacity:.4;margin-top:1px;}
.pmi{display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;color:rgba(255,255,255,.78);font-family:'DM Sans',sans-serif;font-size:13px;padding:9px 18px;cursor:pointer;transition:background .15s,color .15s;text-align:left;}
.pmi:hover{background:rgba(255,255,255,.05);color:#fff;}
.pmi.so{color:#f87171;}
.pmi.so:hover{background:rgba(248,113,113,.07);}
.mob-hbg{display:none;background:none;border:none;color:#fff;cursor:pointer;padding:8px;}
.mm{position:absolute;top:62px;left:0;right:0;background:rgba(9,9,9,.98);border-bottom:1px solid var(--bdr);padding:8px 0;display:flex;flex-direction:column;z-index:9998;}
.mmi{background:none;border:none;color:rgba(255,255,255,.75);font-family:'DM Sans',sans-serif;font-size:14px;padding:12px 4%;text-align:left;cursor:pointer;transition:color .2s;}
.mmi.act,.mmi:hover{color:#fff;}
.gs{display:flex;gap:10px;padding:16px 4% 10px;overflow-x:auto;scrollbar-width:none;position:relative;z-index:3;}
.gs::-webkit-scrollbar{display:none;}
.gc{position:relative;display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.75);font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;padding:8px 15px;border-radius:6px;cursor:pointer;white-space:nowrap;overflow:hidden;transition:border-color .25s,color .25s,background .25s;}
.gc::before{content:'';position:absolute;inset:0;background:rgba(229,9,20,.12);opacity:0;transition:opacity .25s;pointer-events:none;}
.gc:hover::before,.gca::before{opacity:1;}
.gc:hover,.gca{border-color:rgba(229,9,20,.5);color:#fff;}
.gca{background:rgba(229,9,20,.15);}
.ge{font-size:15px;line-height:1;}
.gl{position:relative;z-index:1;}
.gu{position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--red);transform:scaleX(0);transform-origin:left;transition:transform .28s cubic-bezier(.4,0,.2,1);}
.gc:hover .gu,.gca .gu{transform:scaleX(1);}
.hero{position:relative;height:88vh;min-height:480px;overflow:hidden;}
.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center top;animation:hz 8s ease-in-out forwards;transform:scale(1.06);}
@keyframes hz{from{transform:scale(1.06)}to{transform:scale(1)}}
.hvig{position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,.88) 0%,rgba(0,0,0,.35) 55%,transparent 100%);}
.hfade{position:absolute;bottom:0;left:0;right:0;height:42%;background:linear-gradient(to top,var(--bg),transparent);}
.hcnt{position:absolute;top:clamp(90px, 20%, 200px);left:4%;max-width:530px;animation:hup .85s cubic-bezier(.16,1,.3,1) both;}
@keyframes hup{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
.hbdg{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:700;letter-spacing:2px;color:var(--red);background:linear-gradient(90deg,rgba(229,9,20,.08),rgba(229,9,20,.22),rgba(229,9,20,.08));background-size:200% auto;border:1px solid rgba(229,9,20,.28);padding:4px 12px;border-radius:20px;margin-bottom:12px;animation:shimmer 3s linear infinite;}
.htitle{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.8rem,8vw,5.5rem);line-height:.95;letter-spacing:1px;margin-bottom:12px;text-shadow:0 4px 20px rgba(0,0,0,.65);}
.hmeta{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
.hmatch{color:var(--green);font-weight:700;font-size:13px;}
.hyr,.hep{font-size:13px;opacity:.65;}
.hmat{border:1px solid rgba(255,255,255,.35);font-size:11px;padding:1px 5px;border-radius:2px;}
.hdesc{font-size:14px;line-height:1.65;color:rgba(255,255,255,.82);margin-bottom:22px;max-width:440px;}
.hacts{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
.bplay{display:inline-flex;align-items:center;gap:7px;background:#fff;color:#000;font-family:'DM Sans',sans-serif;font-weight:700;font-size:14px;padding:10px 24px;border:none;border-radius:4px;cursor:pointer;transition:background .2s,transform .15s;}
.bplay:hover{background:rgba(255,255,255,.86);transform:scale(1.03);}
.bplay.sm{padding:8px 18px;font-size:13px;}
.bmore{display:inline-flex;align-items:center;gap:7px;background:rgba(109,109,110,.65);color:#fff;font-family:'DM Sans',sans-serif;font-weight:600;font-size:14px;padding:10px 22px;border:none;border-radius:4px;cursor:pointer;backdrop-filter:blur(8px);transition:background .2s;}
.bmore:hover{background:rgba(109,109,110,.45);}
.badd{display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.35);color:#fff;width:40px;height:40px;border-radius:50%;cursor:pointer;transition:all .2s;}
.badd:hover{border-color:#fff;background:rgba(255,255,255,.18);}
.hpb{height:2px;background:rgba(255,255,255,.12);border-radius:2px;overflow:hidden;width:220px;}
.hmute{position:absolute;bottom:20%;right:4%;background:rgba(0,0,0,.55);border:1.5px solid rgba(255,255,255,.45);color:#fff;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;}
.hmute:hover{background:rgba(0,0,0,.88);border-color:#fff;}
.hmatb{position:absolute;right:4%;bottom:calc(20% - 46px);border-left:2px solid rgba(255,255,255,.5);padding:3px 8px;font-size:12px;color:rgba(255,255,255,.75);}
.row{padding:0 4%;margin-bottom:4px;}
.rowh{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.rowt{font-size:18px;font-weight:700;}
.rowsa{background:none;border:none;color:rgba(255,255,255,.4);font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;transition:color .2s;}
.rowsa:hover{color:#fff;}
.roww{position:relative;}
.rscr{display:flex;gap:6px;overflow-x:auto;overflow-y:visible;padding:30px 0 30px;margin:-20px 0 -20px;scrollbar-width:none;scroll-snap-type:x mandatory;}
.rscr::-webkit-scrollbar{display:none;}
.arr{position:absolute;top:50%;transform:translateY(-50%);z-index:10;background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.18);color:#fff;width:40px;height:var(--ch);max-height:124px;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;backdrop-filter:blur(8px);}
.arr:hover{background:rgba(20,20,20,.95);}
.al{left:-2px;}.ar{right:-2px;}
.card{position:relative;flex-shrink:0;width:var(--cw);cursor:pointer;scroll-snap-align:start;transition:transform .32s cubic-bezier(.34,1.56,.64,1);border-radius:5px;overflow:hidden;}
.chov{transform:scale(1.26) translateY(-7px);z-index:100;box-shadow:0 20px 44px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08),0 0 20px rgba(229,9,20,.08);}
.cib{width:100%;height:var(--ch);overflow:hidden;position:relative;border-radius:5px 5px 0 0;}
.card:not(.chov) .cib{border-radius:5px;}
.cimg{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s;}
.chov .cimg{transform:scale(1.06);}
.cgr{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.8) 0%,transparent 60%);}
.crat{position:absolute;bottom:7px;left:8px;display:flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:var(--yel);}
.rnk{position:absolute;top:6px;left:7px;font-family:'Bebas Neue',sans-serif;font-size:38px;color:rgba(255,255,255,.9);line-height:1;text-shadow:2px 2px 0 rgba(0,0,0,.88),-1px -1px 0 rgba(0,0,0,.5);z-index:5;}
.chov-c{background:var(--s2);padding:9px 11px 11px;display:none;border-radius:0 0 5px 5px;}
.chov .chov-c{display:block;}
.cname{font-size:13px;font-weight:700;margin-bottom:7px;}
.cacts{display:flex;align-items:center;gap:5px;margin-bottom:7px;}
.caplay{background:#fff;border:none;color:#000;width:27px;height:27px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.caico{background:none;border:1.5px solid rgba(255,255,255,.35);color:#fff;width:27px;height:27px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:border-color .15s;}
.caico:hover{border-color:#fff;}
.cainfo{margin-left:auto;}
.cmeta{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:5px;}
.cmt{color:var(--green);font-size:11px;font-weight:700;}
.cmc{border:1px solid rgba(255,255,255,.35);font-size:9.5px;padding:1px 4px;border-radius:2px;}
.cmd{display:flex;align-items:center;gap:2px;font-size:10px;opacity:.55;}
.ctags{font-size:10px;opacity:.45;line-height:1.4;}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.76);backdrop-filter:blur(6px);z-index:20000;display:flex;align-items:center;justify-content:center;padding:18px;animation:fdin .22s ease;}
@keyframes fdin{from{opacity:0}to{opacity:1}}
.mbox{background:#141414;border-radius:9px;width:100%;max-width:840px;max-height:90vh;overflow-y:auto;position:relative;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.18) transparent;animation:mpop .32s cubic-bezier(.34,1.56,.64,1);}
@keyframes mpop{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
.mbox::-webkit-scrollbar{width:3px;}
.mbox::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:2px;}
.mcls{position:absolute;top:12px;right:12px;z-index:10;background:rgba(20,20,20,.92);border:none;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s;}
.mcls:hover{background:#2a2a2a;}
.mhi{position:relative;height:340px;overflow:hidden;border-radius:9px 9px 0 0;}
.mhi img{width:100%;height:100%;object-fit:cover;}
.mhf{position:absolute;inset:0;background:linear-gradient(to top,#141414 0%,transparent 55%);}
.mhc{position:absolute;bottom:22px;left:22px;}
.mht{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.8rem,5vw,3rem);margin-bottom:14px;}
.mha{display:flex;align-items:center;gap:9px;}
.bic{background:rgba(255,255,255,.1);border:2px solid rgba(255,255,255,.4);color:#fff;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;}
.bic:hover,.bic.act{border-color:#fff;background:rgba(255,255,255,.2);}
.bic.lk{border-color:var(--red);background:rgba(229,9,20,.2);}
.mbg{display:grid;grid-template-columns:1.55fr 1fr;gap:26px;padding:26px 26px 0;}
.mbl{display:flex;flex-direction:column;}
.mpls{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:12px;}
.pl{font-size:12.5px;font-weight:500;padding:3px 9px;background:rgba(255,255,255,.07);border-radius:3px;}
.pl.g{color:var(--green);}.pl.r{border:1px solid rgba(255,255,255,.28);}.pl.b{color:rgba(255,255,255,.65);}
.mdes{font-size:14px;line-height:1.68;color:rgba(255,255,255,.82);}
.mbr{display:flex;flex-direction:column;gap:9px;font-size:12.5px;color:rgba(255,255,255,.55);padding-top:34px;}
.lbl{font-weight:600;color:rgba(255,255,255,.35);margin-right:3px;}
.msim{padding:22px 26px 26px;}
.msimh{font-size:11px;letter-spacing:1.2px;opacity:.45;margin-bottom:12px;}
.msimg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.msimc{cursor:pointer;border-radius:5px;overflow:hidden;transition:transform .2s;}
.msimc:hover{transform:scale(1.03);}
.msimc img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;}
.msimn{font-size:12px;font-weight:600;padding:6px 6px 2px;}
.msimm{font-size:11px;color:var(--green);font-weight:700;padding:0 6px 6px;}
.sbox{background:#141414;border-radius:9px;width:100%;max-width:540px;padding:36px;position:relative;animation:mpop .28s ease;}
.sbox.wide{max-width:680px;}
.stit{font-family:'Bebas Neue',sans-serif;font-size:30px;margin-bottom:4px;}
.pew{display:flex;gap:22px;margin-top:22px;border-top:1px solid var(--bdr);padding-top:22px;}
.pavc{display:flex;flex-direction:column;align-items:center;gap:9px;}
.avc{background:none;border:1px solid rgba(255,255,255,.28);color:#fff;font-size:11px;padding:4px 12px;border-radius:3px;cursor:pointer;}
.flbl{display:block;font-size:11px;font-weight:600;letter-spacing:1px;opacity:.45;margin-bottom:5px;text-transform:uppercase;}
.finp{width:100%;padding:11px 13px;background:#222;border:1px solid rgba(255,255,255,.09);border-radius:4px;color:#fff;font-family:'DM Sans',sans-serif;font-size:13px;outline:none;transition:border-color .2s;}
.finp:focus{border-color:rgba(255,255,255,.28);}
.bsv{background:var(--red);color:#fff;font-family:'DM Sans',sans-serif;font-weight:700;font-size:13.5px;padding:11px 26px;border:none;border-radius:4px;cursor:pointer;transition:background .2s;}
.bsv:hover{background:#c00;}
.bcn{background:transparent;color:#fff;font-family:'DM Sans',sans-serif;font-weight:600;font-size:13.5px;padding:11px 22px;border:1px solid rgba(255,255,255,.28);border-radius:4px;cursor:pointer;}
.stg{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:26px;}
.stc{background:var(--s2);border-radius:7px;padding:22px 14px;text-align:center;}
.stv{font-family:'Bebas Neue',sans-serif;font-size:42px;line-height:1;}
.stl{font-size:11px;opacity:.45;margin-top:5px;font-weight:600;letter-spacing:.5px;}
.pwp{height:2.5px;background:rgba(255,255,255,.12);border-radius:2px;overflow:hidden;margin-top:7px;}
.pwb{height:100%;background:var(--red);border-radius:2px;}
.srows{border-top:1px solid var(--bdr);}
.srow{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--bdr);}
.slbl{color:rgba(255,255,255,.45);font-size:13px;}
.tog{width:42px;height:22px;background:rgba(255,255,255,.18);border-radius:11px;cursor:pointer;position:relative;transition:background .3s;}
.ton{background:var(--red);}
.tok{position:absolute;width:16px;height:16px;background:#fff;border-radius:50%;top:3px;left:3px;transition:left .3s;box-shadow:0 1px 3px rgba(0,0,0,.4);}
.ton .tok{left:23px;}
@media(max-width:768px){
  .nl{display:none;}.mob-hbg{display:flex;}.an{display:none;}
  .hcnt{left:5%;right:5%;max-width:100%;}
  .mbg{grid-template-columns:1fr;}
  .msimg{grid-template-columns:repeat(2,1fr);}
  .stg{grid-template-columns:repeat(2,1fr);}
  .pew{flex-direction:column;}
  .footer-grid{grid-template-columns:repeat(2,1fr);}
}
.card-play-ov{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);width:48px;height:48px;background:rgba(0,0,0,.65);border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .25s;opacity:0;z-index:6;backdrop-filter:blur(8px);border:2px solid rgba(255,255,255,.2);}
.card:hover .card-play-ov{transform:translate(-50%,-50%) scale(1);opacity:1;}
.card-play-ov:hover{background:rgba(229,9,20,.85);border-color:rgba(229,9,20,.5);transform:translate(-50%,-50%) scale(1.12);}
.card-hd-badge{position:absolute;top:7px;right:7px;background:linear-gradient(135deg,rgba(229,9,20,.95),rgba(255,80,80,.85));color:#fff;font-size:8px;font-weight:800;padding:2px 6px;border-radius:3px;z-index:6;letter-spacing:.5px;text-shadow:0 1px 2px rgba(0,0,0,.4);}
.card-new-badge{position:absolute;top:7px;left:7px;background:linear-gradient(135deg,#ff6b00,#ff2d2d);color:#fff;font-size:8px;font-weight:800;padding:2px 8px;border-radius:10px;z-index:6;animation:pulse-badge 2s ease-in-out infinite;}
.card-top-badge{position:absolute;top:28px;left:7px;background:linear-gradient(135deg,#f6c90e,#ff8c00);color:#000;font-size:8px;font-weight:900;padding:2px 6px;border-radius:3px;z-index:6;}
@keyframes pulse-badge{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.85;transform:scale(1.05)}}
.hero-dots{position:absolute;bottom:8%;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10;}
.hero-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.3);border:none;cursor:pointer;transition:all .3s;padding:0;}
.hero-dot:hover{background:rgba(255,255,255,.6);}
.hero-dot.active{background:#e50914;width:28px;border-radius:5px;box-shadow:0 0 10px rgba(229,9,20,.6);}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
.footer{position:relative;z-index:2;padding:60px 4% 40px;border-top:1px solid rgba(255,255,255,.06);margin-top:40px;}
.footer-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;max-width:900px;margin:0 auto 40px;}
.footer-col a{display:block;color:rgba(255,255,255,.35);font-size:12.5px;text-decoration:none;padding:4px 0;transition:color .2s;}
.footer-col a:hover{color:rgba(255,255,255,.75);text-decoration:underline;}
.footer-bottom{text-align:center;opacity:.25;font-size:11px;padding-top:24px;border-top:1px solid rgba(255,255,255,.06);}
.footer-logo{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;margin-bottom:6px;color:var(--red);}
`;

