import { readFileSync, writeFileSync } from 'fs';

const file = 'src/pages/HomePage.jsx';
const lines = readFileSync(file, 'utf8').split('\n');

// Lines 430-663 (0-indexed: 429-662) = FREE_VIDEOS + getVideoForMovie + old VideoPlayer
// We replace them with new streaming server config + upgraded VideoPlayer

const newBlock = `/* ─── STREAMING SERVERS (Real Movies & Series) ────────────── */
const MOVIE_SERVERS = [
  { name: 'VidSrc',     color: '#e50914', getUrl: (id) => \`https://vidsrc.net/embed/movie/\${id}\` },
  { name: 'VidSrc.me',  color: '#ff4500', getUrl: (id) => \`https://vidsrc.me/embed/movie?tmdb=\${id}\` },
  { name: 'Embed.su',   color: '#6366f1', getUrl: (id) => \`https://embed.su/embed/movie/\${id}\` },
  { name: '2Embed',     color: '#0ea5e9', getUrl: (id) => \`https://www.2embed.cc/embed/\${id}\` },
  { name: 'AutoEmbed',  color: '#8b5cf6', getUrl: (id) => \`https://autoembed.cc/movie/tmdb/\${id}\` },
  { name: 'SuperEmbed', color: '#f59e0b', getUrl: (id) => \`https://multiembed.mov/?video_id=\${id}&tmdb=1\` },
  { name: 'Videasy',    color: '#10b981', getUrl: (id) => \`https://player.videasy.net/movie/\${id}\` },
  { name: 'MoviesAPI',  color: '#ec4899', getUrl: (id) => \`https://moviesapi.club/movie/\${id}\` },
];
const TV_SERVERS = [
  { name: 'VidSrc',     color: '#e50914', getUrl: (id,s,e) => \`https://vidsrc.net/embed/tv/\${id}/\${s}/\${e}\` },
  { name: 'VidSrc.me',  color: '#ff4500', getUrl: (id,s,e) => \`https://vidsrc.me/embed/tv?tmdb=\${id}&season=\${s}&episode=\${e}\` },
  { name: 'Embed.su',   color: '#6366f1', getUrl: (id,s,e) => \`https://embed.su/embed/tv/\${id}/\${s}/\${e}\` },
  { name: '2Embed',     color: '#0ea5e9', getUrl: (id,s,e) => \`https://www.2embed.cc/embedtv/\${id}&s=\${s}&e=\${e}\` },
  { name: 'AutoEmbed',  color: '#8b5cf6', getUrl: (id,s,e) => \`https://autoembed.cc/tv/tmdb/\${id}-\${s}-\${e}\` },
  { name: 'SuperEmbed', color: '#f59e0b', getUrl: (id,s,e) => \`https://multiembed.mov/?video_id=\${id}&tmdb=1&s=\${s}&e=\${e}\` },
  { name: 'Videasy',    color: '#10b981', getUrl: (id,s,e) => \`https://player.videasy.net/tv/\${id}/\${s}/\${e}\` },
  { name: 'MoviesAPI',  color: '#ec4899', getUrl: (id,s,e) => \`https://moviesapi.club/tv/\${id}-\${s}-\${e}\` },
];

// Legacy helper used by Card download button
function getVideoForMovie(movie) {
  return { url: '', title: movie.title, ep: 'Full Movie', duration: '' };
}

/* ─── VIDEO PLAYER ───────────────────────────────────────── */
function VideoPlayer({ movie, onClose }) {
  const isTV = movie.type === 'tv' || movie.episodes === 'TV Series' || (movie.episodes || '').includes('Season');
  const [selSeason, setSelSeason] = useState(movie.seasonNum || 1);
  const [selEp, setSelEp] = useState(movie.currentEpisode?.episode_number || 1);
  const [seasons, setSeasons] = useState([]);
  const [eps, setEps] = useState([]);
  const [serverIdx, setServerIdx] = useState(0);
  const [loadingEps, setLoadingEps] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const loadTimerRef = useRef(null);

  const servers = isTV ? TV_SERVERS : MOVIE_SERVERS;
  const srv = servers[serverIdx] || servers[0];
  const embedUrl = isTV ? srv.getUrl(movie.id, selSeason, selEp) : srv.getUrl(movie.id);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);
  useEffect(() => { if (movie) { const u = getCurrentUser(); if (u) trackWatch(u, movie); } }, [movie]);

  useEffect(() => {
    setIframeLoading(true);
    setIframeKey(k => k + 1);
    clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => setIframeLoading(false), 20000);
    return () => clearTimeout(loadTimerRef.current);
  }, [serverIdx, selSeason, selEp]);

  useEffect(() => {
    if (!isTV) return;
    fetch(\`/api/movies/tv/\${movie.id}/seasons\`)
      .then(r => r.json()).then(d => setSeasons(d.seasons || []))
      .catch(() => setSeasons([{ season_number: 1, name: 'Season 1', episode_count: 12 }]));
  }, [movie.id, isTV]);

  useEffect(() => {
    if (!isTV) return;
    setLoadingEps(true);
    fetch(\`/api/movies/tv/\${movie.id}/season/\${selSeason}\`)
      .then(r => r.json()).then(d => { setEps(Array.isArray(d) ? d : []); setLoadingEps(false); })
      .catch(() => { setEps([]); setLoadingEps(false); });
  }, [movie.id, selSeason, isTV]);

  const switchServer = (i) => { setServerIdx(i); setIframeLoading(true); };
  const nextServer = () => switchServer(serverIdx < servers.length - 1 ? serverIdx + 1 : 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 99999, display: 'flex', flexDirection: 'column', fontFamily: 'Inter,sans-serif' }}>
      <style>{\`@keyframes spin{to{transform:rotate(360deg)}} @keyframes spin2{to{transform:rotate(-360deg)}}\`}</style>

      {/* TOP BAR */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 14px', background:'#0d0d0d', borderBottom:'1px solid #1e1e1e', flexShrink:0, flexWrap:'wrap' }}>
        <button onClick={onClose} style={{ background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', color:'#fff', width:34, height:34, borderRadius:'50%', cursor:'pointer', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>←</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(.95rem,2vw,1.4rem)', color:'#fff', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{movie.title}</h2>
            <span style={{ background: isTV ? '#6441a5':'#e50914', color:'#fff', fontSize:9, padding:'2px 7px', borderRadius:4, fontWeight:700, letterSpacing:1, flexShrink:0 }}>{isTV ? 'SERIES':'MOVIE'}</span>
            <span style={{ background:'rgba(255,255,255,.07)', color:'#aaa', fontSize:9, padding:'2px 6px', borderRadius:4, fontWeight:700, flexShrink:0 }}>HD</span>
          </div>
          <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,.35)' }}>{isTV ? \`Season \${selSeason} · Ep \${selEp}\` : 'Full Movie'} · {movie.year} · {srv.name}</p>
        </div>

        {/* Server buttons */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center', flexShrink:0 }}>
          <span style={{ fontSize:9, color:'#444', textTransform:'uppercase', letterSpacing:1 }}>Server:</span>
          {servers.map((s, i) => (
            <button key={s.name} onClick={() => switchServer(i)} title={s.name}
              style={{ background: serverIdx===i ? s.color : 'rgba(255,255,255,.05)', border:\`1px solid \${serverIdx===i ? s.color : 'rgba(255,255,255,.08)'}\`, color: serverIdx===i ? '#fff':'#777', padding:'3px 10px', borderRadius:20, cursor:'pointer', fontSize:10, fontWeight:700, transition:'all .2s', whiteSpace:'nowrap' }}>
              {s.name}
            </button>
          ))}
        </div>

        {isTV && (
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ background: sidebarOpen ? '#6441a5':'rgba(255,255,255,.06)', border:\`1px solid \${sidebarOpen ? '#6441a5':'rgba(255,255,255,.1)'}\`, color:'#fff', padding:'4px 12px', borderRadius:20, cursor:'pointer', fontSize:10, fontWeight:700, flexShrink:0 }}>
            {sidebarOpen ? '⊟ Episodes':'☰ Episodes'}
          </button>
        )}
      </div>

      {/* BODY */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>

        {/* VIDEO AREA */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', background:'#000' }}>
          {iframeLoading && (
            <div style={{ position:'absolute', inset:0, background:'#000', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:18 }}>
              <div style={{ position:'relative', width:68, height:68 }}>
                <div style={{ position:'absolute', inset:0, border:'3px solid rgba(255,255,255,.05)', borderTop:\`3px solid \${srv.color}\`, borderRadius:'50%', animation:'spin .9s linear infinite' }} />
                <div style={{ position:'absolute', inset:12, border:'2px solid rgba(255,255,255,.03)', borderTop:\`2px solid \${srv.color}80\`, borderRadius:'50%', animation:'spin2 1.4s linear infinite' }} />
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ margin:0, fontSize:14, color:'#fff', fontWeight:600 }}>Loading {srv.name}…</p>
                <p style={{ margin:'5px 0 0', fontSize:11, color:'#444' }}>Connecting to streaming server</p>
              </div>
              <button onClick={nextServer} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'#888', padding:'7px 18px', borderRadius:20, cursor:'pointer', fontSize:11 }}>Try Next Server →</button>
            </div>
          )}

          {!iframeLoading && serverIdx < servers.length - 1 && (
            <div style={{ position:'absolute', bottom:16, right:16, zIndex:20 }}>
              <button onClick={nextServer} style={{ background:'rgba(10,10,10,.9)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,165,0,.3)', color:'#ffa500', padding:'7px 16px', borderRadius:20, cursor:'pointer', fontSize:11, fontWeight:700 }}>
                ⚡ Not Working? Switch Server
              </button>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={embedUrl}
            style={{ flex:1, width:'100%', border:'none', background:'#000', display:'block' }}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            onLoad={() => { setIframeLoading(false); clearTimeout(loadTimerRef.current); }}
          />
        </div>

        {/* EPISODE SIDEBAR */}
        {isTV && sidebarOpen && (
          <div style={{ width:265, background:'#0a0a0a', borderLeft:'1px solid #1a1a1a', display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>
            <div style={{ padding:'10px 12px', borderBottom:'1px solid #1a1a1a', flexShrink:0 }}>
              <p style={{ margin:'0 0 7px', fontSize:9, color:'#444', textTransform:'uppercase', letterSpacing:1.5 }}>Season</p>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {seasons.length > 0 ? seasons.map(s => (
                  <button key={s.season_number} onClick={() => { setSelSeason(s.season_number); setSelEp(1); }}
                    style={{ background: selSeason===s.season_number ? '#e50914':'rgba(255,255,255,.06)', border:\`1px solid \${selSeason===s.season_number ? '#e50914':'rgba(255,255,255,.07)'}\`, color:'#fff', padding:'3px 11px', borderRadius:12, cursor:'pointer', fontSize:11, fontWeight:700, transition:'all .2s' }}>
                    S{s.season_number}
                  </button>
                )) : <button style={{ background:'#e50914', border:'none', color:'#fff', padding:'3px 11px', borderRadius:12, fontSize:11, fontWeight:700 }}>S1</button>}
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'5px 0' }}>
              {loadingEps ? (
                <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:70 }}>
                  <div style={{ width:24, height:24, border:'2px solid rgba(255,255,255,.07)', borderTop:'2px solid #e50914', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
                </div>
              ) : eps.length === 0 ? (
                Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setSelEp(n)}
                    style={{ display:'flex', alignItems:'center', gap:9, width:'100%', background: selEp===n ? 'rgba(229,9,20,.13)':'transparent', border:'none', borderLeft: selEp===n ? '3px solid #e50914':'3px solid transparent', color:'#fff', padding:'8px 13px', cursor:'pointer', textAlign:'left', transition:'background .15s' }}>
                    <span style={{ width:25, height:25, borderRadius:'50%', background: selEp===n ? '#e50914':'rgba(255,255,255,.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{n}</span>
                    <span style={{ fontSize:12, color: selEp===n ? '#fff':'#777' }}>Episode {n}</span>
                    {selEp===n && <span style={{ marginLeft:'auto', color:'#e50914', fontSize:12 }}>▶</span>}
                  </button>
                ))
              ) : (
                eps.map(ep => (
                  <button key={ep.episode_number} onClick={() => setSelEp(ep.episode_number)}
                    style={{ display:'flex', alignItems:'flex-start', gap:9, width:'100%', background: selEp===ep.episode_number ? 'rgba(229,9,20,.13)':'transparent', border:'none', borderLeft: selEp===ep.episode_number ? '3px solid #e50914':'3px solid transparent', color:'#fff', padding:'9px 12px', cursor:'pointer', textAlign:'left', transition:'background .15s' }}>
                    {ep.still ? (
                      <img src={ep.still} alt="" style={{ width:70, height:40, objectFit:'cover', borderRadius:4, flexShrink:0, opacity: selEp===ep.episode_number ? 1:0.55 }} onError={e => e.target.style.display='none'} />
                    ) : (
                      <span style={{ width:26, height:26, borderRadius:'50%', background: selEp===ep.episode_number ? '#e50914':'rgba(255,255,255,.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0, marginTop:3 }}>{ep.episode_number}</span>
                    )}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:12, fontWeight:600, color: selEp===ep.episode_number ? '#fff':'#aaa', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ep.name || \`Episode \${ep.episode_number}\`}</p>
                      <p style={{ margin:'2px 0 0', fontSize:10, color:'#3a3a3a' }}>{ep.runtime||'24 min'}{ep.air_date ? ' · '+ep.air_date.slice(0,4) : ''}</p>
                    </div>
                    {selEp===ep.episode_number && <span style={{ fontSize:12, marginTop:4, color:'#e50914', flexShrink:0 }}>▶</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}`;

// Replace lines 429 to 662 (0-indexed) — i.e. old FREE_VIDEOS through end of old VideoPlayer
const before = lines.slice(0, 429).join('\n');
const after = lines.slice(663).join('\n');
const result = before + '\n' + newBlock + '\n' + after;
writeFileSync(file, result, 'utf8');
console.log('Done! Lines written:', result.split('\n').length);
