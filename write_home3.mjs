import { appendFileSync } from 'fs';

const p3 = `
function MovieModal({movie,onClose}){
  const [list,setList]=useState(false);
  const [liked,setLiked]=useState(false);
  useEffect(()=>{document.body.style.overflow="hidden";return()=>{document.body.style.overflow="";};},[]);
  const sim=MOVIES.filter(m=>m.id!==movie.id&&m.tags.some(t=>movie.tags.includes(t))).slice(0,3);
  return(
    <div className="ov" onClick={onClose}>
      <div className="mbox" onClick={e=>e.stopPropagation()}>
        <button className="mcls" onClick={onClose}><X size={18}/></button>
        <div className="mhi"><img src={movie.backdrop} alt={movie.title}/><div className="mhf"/><div className="mhc">
          <h2 className="mht">{movie.title}</h2>
          <div className="mha">
            <button className="bplay sm"><Play fill="#000" size={16}/> Play</button>
            <button className={\`bic \${list?"act":""}\`} onClick={()=>setList(l=>!l)}>{list?<Bookmark size={16} fill="white"/>:<Plus size={16}/>}</button>
            <button className={\`bic \${liked?"lk":""}\`} onClick={()=>setLiked(l=>!l)}><ThumbsUp size={16} fill={liked?"white":"none"}/></button>
            <button className="bic"><Share2 size={14}/></button>
          </div>
        </div></div>
        <div className="mbg">
          <div className="mbl">
            <div className="mpls">
              <span className="pl g">{movie.match}% Match</span><span className="pl">{movie.year}</span>
              <span className="pl r">{movie.maturity}</span><span className="pl">{movie.episodes}</span><span className="pl b">HD</span>
            </div>
            <p className="mdes">{movie.desc}</p>
          </div>
          <div className="mbr">
            <p><span className="lbl">Cast:</span> {movie.cast}</p>
            <p><span className="lbl">Genres:</span> {movie.tags.join(", ")}</p>
            <p><span className="lbl">Duration:</span> {movie.duration}</p>
            <p><span className="lbl">Rating:</span> <Star size={11} fill="#f6c90e" color="#f6c90e" style={{verticalAlign:"middle"}}/> {movie.rating}/10</p>
          </div>
        </div>
        {sim.length>0&&<div className="msim"><h4 className="msimh">MORE LIKE THIS</h4><div className="msimg">{sim.map(m=><div key={m.id} className="msimc"><img src={m.thumbnail} alt={m.title}/><p className="msimn">{m.title}</p><p className="msimm">{m.match}% Match</p></div>)}</div></div>}
      </div>
    </div>
  );
}

function ProfileModal({onClose}){
  const [name,setName]=useState("Nishant");
  return(
    <div className="ov" onClick={onClose} style={{zIndex:50000}}>
      <div className="sbox" onClick={e=>e.stopPropagation()}>
        <button className="mcls" onClick={onClose}><X size={18}/></button>
        <h2 className="stit">Edit Profile</h2>
        <div className="pew">
          <div className="pavc"><img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" width={90} style={{borderRadius:6}} alt="av"/><button className="avc">Change</button></div>
          <div style={{flex:1}}>
            <label className="flbl">Display Name</label>
            <input className="finp" value={name} onChange={e=>setName(e.target.value)}/>
            <label className="flbl" style={{marginTop:14}}>Language</label>
            <select className="finp"><option>English</option><option>Hindi</option><option>Japanese</option></select>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button className="bsv" onClick={onClose}>Save Changes</button>
              <button className="bcn" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyListModal({onClose}){
  const stats=[{v:42,l:"Watched",c:"#e50914"},{v:8,l:"Watching",c:"#46d369"},{v:19,l:"Saved",c:"#3b82f6"},{v:156,l:"Hours",c:"#f6c90e"}];
  return(
    <div className="ov" onClick={onClose} style={{zIndex:50000}}>
      <div className="sbox wide" onClick={e=>e.stopPropagation()}>
        <button className="mcls" onClick={onClose}><X size={18}/></button>
        <h2 className="stit">My List &amp; Activity</h2>
        <p style={{color:"rgba(255,255,255,.45)",fontSize:13,marginBottom:24}}>Your complete watch history and favorites</p>
        <div className="stg">{stats.map(s=><div key={s.l} className="stc"><div className="stv" style={{color:s.c}}>{s.v}</div><div className="stl">{s.l}</div></div>)}</div>
        <h4 style={{fontSize:11,letterSpacing:1,opacity:.45,marginBottom:12}}>CONTINUE WATCHING</h4>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {MOVIES.slice(0,3).map(m=>(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:12}}>
              <img src={m.thumbnail} alt={m.title} style={{width:76,height:46,objectFit:"cover",borderRadius:4}}/>
              <div style={{flex:1}}><p style={{fontWeight:600,fontSize:13}}>{m.title}</p><div className="pwp"><div className="pwb" style={{width:"55%"}}/></div></div>
              <button className="bplay sm"><Play size={12} fill="#000"/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DownloadsModal({onClose}){
  return(
    <div className="ov" onClick={onClose} style={{zIndex:50000}}>
      <div className="sbox" onClick={e=>e.stopPropagation()}>
        <button className="mcls" onClick={onClose}><X size={18}/></button>
        <h2 className="stit">Downloads</h2>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {MOVIES.slice(0,4).map(m=>(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:14,paddingBottom:14,borderBottom:"1px solid rgba(255,255,255,.07)"}}>
              <img src={m.thumbnail} alt={m.title} style={{width:68,height:44,objectFit:"cover",borderRadius:4}}/>
              <div style={{flex:1}}><p style={{fontWeight:600,fontSize:13}}>{m.title}</p><p style={{fontSize:11,opacity:.45}}>{m.duration} · {m.maturity}</p></div>
              <span style={{fontSize:11,color:"#46d369",fontWeight:700}}>READY</span>
            </div>
          ))}
        </div>
        <p style={{marginTop:18,fontSize:11,opacity:.35,textAlign:"center"}}>4 titles available offline</p>
      </div>
    </div>
  );
}

function SettingsModal({onClose}){
  const [ap,setAp]=useState(true);
  const [hd,setHd]=useState(true);
  const [nf,setNf]=useState(true);
  const T=({v,s})=><div className={\`tog \${v?"ton":""}\`} onClick={()=>s(x=>!x)}><div className="tok"/></div>;
  return(
    <div className="ov" onClick={onClose} style={{zIndex:50000}}>
      <div className="sbox" onClick={e=>e.stopPropagation()}>
        <button className="mcls" onClick={onClose}><X size={18}/></button>
        <h2 className="stit">Account Settings</h2>
        <div className="srows">
          {[{l:"Email",v:"nishant@netflix.demo"},{l:"Plan",v:"4K HDR · Premium"},{l:"Next Billing",v:"April 1, 2025"}].map(r=>(
            <div key={r.l} className="srow"><span className="slbl">{r.l}</span><span style={{fontWeight:600,fontSize:13}}>{r.v}</span></div>
          ))}
        </div>
        <h4 style={{fontSize:11,letterSpacing:1,opacity:.45,margin:"22px 0 12px"}}>PREFERENCES</h4>
        <div className="srows">
          <div className="srow"><span className="slbl">Autoplay Previews</span><T v={ap} s={setAp}/></div>
          <div className="srow"><span className="slbl">High Definition</span><T v={hd} s={setHd}/></div>
          <div className="srow"><span className="slbl">Notifications</span><T v={nf} s={setNf}/></div>
        </div>
        <button className="bsv" style={{width:"100%",marginTop:22}} onClick={onClose}>Save Settings</button>
      </div>
    </div>
  );
}

function SearchPage({query,onOpen}){
  const res=MOVIES.filter(m=>m.title.toLowerCase().includes(query.toLowerCase())||m.genre.toLowerCase().includes(query.toLowerCase())||m.tags.some(t=>t.toLowerCase().includes(query.toLowerCase())));
  return(
    <div style={{padding:"0 4%"}}>
      <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"clamp(1.8rem,4vw,2.6rem)",marginBottom:24}}>Results for <span style={{color:"rgba(255,255,255,.4)"}}>&ldquo;{query}&rdquo;</span></h2>
      {res.length===0
        ?<div style={{textAlign:"center",padding:"80px 0",opacity:.3,display:"flex",flexDirection:"column",alignItems:"center",gap:12}}><Film size={54}/><p>No titles found.</p></div>
        :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>{res.map(m=><Card key={m.id} movie={m} onOpen={onOpen}/>)}</div>
      }
    </div>
  );
}
`;

appendFileSync('src/pages/HomePage.jsx', p3);
console.log('Part 3 done');
