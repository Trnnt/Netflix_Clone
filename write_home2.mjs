import { appendFileSync } from 'fs';

const p2 = `
function Navbar({scrolled,category,setCategory,onSearch,setActiveModal,setLoggedIn}){
  const [srchOpen,setSrchOpen]=useState(false);
  const [query,setQuery]=useState("");
  const [notifOpen,setNotifOpen]=useState(false);
  const [profOpen,setProfOpen]=useState(false);
  const [mobOpen,setMobOpen]=useState(false);
  const [hovNav,setHovNav]=useState(null);
  const srchRef=useRef(null),notifRef=useRef(null),profRef=useRef(null),inpRef=useRef(null);
  useEffect(()=>{if(srchOpen)inpRef.current?.focus();},[srchOpen]);
  useEffect(()=>{
    const h=e=>{
      if(e.key==="Escape"){setSrchOpen(false);setNotifOpen(false);setProfOpen(false);setQuery("");onSearch("");}
      if(e.type==="mousedown"){
        if(!srchRef.current?.contains(e.target))setSrchOpen(false);
        if(!notifRef.current?.contains(e.target))setNotifOpen(false);
        if(!profRef.current?.contains(e.target))setProfOpen(false);
      }
    };
    document.addEventListener("keydown",h);document.addEventListener("mousedown",h);
    return()=>{document.removeEventListener("keydown",h);document.removeEventListener("mousedown",h);};
  },[onSearch]);
  const notifs=[
    {id:1,text:"New episode of Demon Slayer is out!",time:"2h ago",img:MOVIES[0].thumbnail},
    {id:2,text:"Attack on Titan Final Season added",time:"1d ago",img:MOVIES[3].thumbnail},
    {id:3,text:"New K-Drama recommendations for you",time:"2d ago",img:MOVIES[2].thumbnail},
  ];
  const profMenu=[
    {icon:<User size={14}/>,label:"Edit Profile",modal:"profile"},
    {icon:<Bookmark size={14}/>,label:"My List",modal:"mylist"},
    {icon:<Download size={14}/>,label:"Downloads",modal:"downloads"},
    {icon:<Settings size={14}/>,label:"Settings",modal:"settings"},
    {icon:<LogOut size={14}/>,label:"Sign Out",modal:"signout"},
  ];
  return(
    <nav className={\`nb \${scrolled?"sc":""}\`}>
      <div className="nb-l">
        <div className="logo" onClick={()=>setCategory("Home")}><span className="ln">N</span><span className="le">ETFLIX</span></div>
        <ul className="nl">
          {NAV_ITEMS.map(c=>(
            <li key={c} className={category===c?"act":""} onMouseEnter={()=>setHovNav(c)} onMouseLeave={()=>setHovNav(null)} onClick={()=>setCategory(c)}>
              {c}
              <span className={\`nul \${hovNav===c||category===c?"vis":""} \${category===c?"perm":""}\`}/>
            </li>
          ))}
        </ul>
        <button className="hbg" onClick={()=>setMobOpen(m=>!m)}><Menu size={20}/></button>
      </div>
      <div className="nb-r">
        <div ref={srchRef} className={\`sw \${srchOpen?"op":""}\`}>
          <button className="ib" onClick={()=>setSrchOpen(s=>!s)}><Search size={19}/></button>
          <input ref={inpRef} className="si" placeholder="Titles, genres..." value={query} onChange={e=>{setQuery(e.target.value);onSearch(e.target.value);}}/>
        </div>
        <div ref={notifRef} className="drop-a">
          <button className="ib nb2" onClick={()=>{setNotifOpen(n=>!n);setProfOpen(false);}}><Bell size={19}/><span className="nd"/></button>
          {notifOpen&&<div className="dd ndd">
            <p className="ddh">NOTIFICATIONS</p>
            {notifs.map(n=><div key={n.id} className="ni"><img src={n.img} alt="" className="nth"/><div><p className="ntx">{n.text}</p><p className="ntm">{n.time}</p></div></div>)}
          </div>}
        </div>
        <div ref={profRef} className="drop-a">
          <button className="pb" onClick={()=>{setProfOpen(p=>!p);setNotifOpen(false);}}>
            <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" className="av" alt="av"/>
            <span className="an">Nishant</span>
            <ChevronLeft size={13} style={{transform:profOpen?"rotate(-90deg)":"rotate(-180deg)",transition:"transform .3s"}}/>
          </button>
          {profOpen&&<div className="dd pdd">
            <div className="ph"><img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" width={40} style={{borderRadius:4}} alt="av"/><div><p className="phn">Nishant</p><p className="php">Premium · 4K HDR</p></div></div>
            {profMenu.map(item=>(
              <button key={item.label} className={\`pmi \${item.modal==="signout"?"so":""}\`} onClick={()=>{setProfOpen(false);item.modal==="signout"?setLoggedIn(false):setActiveModal(item.modal);}}>
                {item.icon}<span>{item.label}</span>
              </button>
            ))}
          </div>}
        </div>
      </div>
      {mobOpen&&<div className="mm">{NAV_ITEMS.map(c=><button key={c} className={\`mmi \${category===c?"act":""}\`} onClick={()=>{setCategory(c);setMobOpen(false);}}>{c}</button>)}</div>}
    </nav>
  );
}

function GenreStrip({active,setActive}){
  return(
    <div className="gs">
      {GENRES.map(g=>(
        <button key={g.key} className={\`gc \${active===g.key?"gca":""}\`} onClick={()=>setActive(p=>p===g.key?null:g.key)}>
          <span className="ge">{g.emoji}</span><span className="gl">{g.label}</span><span className="gu"/>
        </button>
      ))}
    </div>
  );
}

function Hero({movie,onOpen}){
  const [muted,setMuted]=useState(true);
  const [prog,setProg]=useState(0);
  useEffect(()=>{setProg(0);const t=setInterval(()=>setProg(p=>Math.min(p+1,100)),80);return()=>clearInterval(t);},[movie]);
  return(
    <div className="hero">
      <div className="hbg" style={{backgroundImage:\`url('\${movie.backdrop}')\`}}/>
      <div className="hvig"/><div className="hfade"/>
      <div className="hcnt">
        <div className="hbdg"><Sparkles size={11}/> FEATURED</div>
        <h1 className="htitle">{movie.title}</h1>
        <div className="hmeta">
          <span className="hmatch">{movie.match}% Match</span>
          <span className="hyr">{movie.year}</span>
          <span className="hmat">{movie.maturity}</span>
          <span className="hep">{movie.episodes}</span>
          <Star size={11} fill="#f6c90e" color="#f6c90e"/>
          <span style={{color:"#f6c90e",fontWeight:700,fontSize:13}}>{movie.rating}</span>
        </div>
        <p className="hdesc">{movie.desc}</p>
        <div className="hacts">
          <button className="bplay"><Play fill="#000" size={20}/> Play</button>
          <button className="bmore" onClick={()=>onOpen(movie)}><Info size={18}/> More Info</button>
          <button className="badd"><Plus size={18}/></button>
        </div>
        <div className="hpb"><div style={{width:\`\${prog}%\`,height:"100%",background:"#e50914",borderRadius:2,transition:"width .08s linear"}}/></div>
      </div>
      <button className="hmute" onClick={()=>setMuted(m=>!m)}>{muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button>
      <div className="hmatb">{movie.maturity}</div>
    </div>
  );
}

function Card({movie,onOpen,rank}){
  const [hov,setHov]=useState(false);
  const [list,setList]=useState(false);
  const timer=useRef(null);
  const enter=()=>{timer.current=setTimeout(()=>setHov(true),380);};
  const leave=()=>{clearTimeout(timer.current);setHov(false);};
  return(
    <div className={\`card \${hov?"chov":""}\`} onMouseEnter={enter} onMouseLeave={leave} onClick={()=>onOpen(movie)}>
      {rank&&<span className="rnk">{rank}</span>}
      <div className="cib">
        <img src={movie.thumbnail} alt={movie.title} className="cimg" onError={e=>{e.target.src="https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&q=80";}}/>
        <div className="csm"/><div className="cgr"/>
        <div className="crat"><Star size={10} fill="#f6c90e" color="#f6c90e"/> {movie.rating}</div>
      </div>
      <div className="chov-c">
        <h4 className="cname">{movie.title}</h4>
        <div className="cacts">
          <button className="caplay" onClick={e=>e.stopPropagation()}><Play size={13} fill="#000"/></button>
          <button className="caico" onClick={e=>{e.stopPropagation();setList(l=>!l);}}>{list?<Check size={14}/>:<Plus size={14}/>}</button>
          <button className="caico" onClick={e=>e.stopPropagation()}><ThumbsUp size={13}/></button>
          <button className="caico cainfo" onClick={e=>{e.stopPropagation();onOpen(movie);}}><Info size={13}/></button>
        </div>
        <div className="cmeta">
          <span className="cmt">{movie.match}%</span>
          <span className="cmc">{movie.maturity}</span>
          <span className="cmd"><Clock size={9}/> {movie.duration}</span>
        </div>
        <div className="ctags">{movie.tags.slice(0,3).map((t,i)=><span key={t}>{t}{i<Math.min(movie.tags.length,3)-1?" · ":""}</span>)}</div>
      </div>
    </div>
  );
}

function Row({title,movies,onOpen,rank}){
  const ref=useRef(null);
  const [cl,setCl]=useState(false);
  const [cr,setCr]=useState(true);
  if(!movies||!movies.length)return null;
  const upd=()=>{if(!ref.current)return;setCl(ref.current.scrollLeft>0);setCr(ref.current.scrollLeft+ref.current.offsetWidth<ref.current.scrollWidth-10);};
  const scroll=d=>{ref.current.scrollBy({left:d*840,behavior:"smooth"});setTimeout(upd,420);};
  return(
    <section className="row">
      <div className="rowh"><h3 className="rowt">{title}</h3><button className="rowsa">See All...</button></div>
      <div className="roww">
        {cl&&<button className="arr al" onClick={()=>scroll(-1)}><ChevronLeft size={22}/></button>}
        <div className="rscr" ref={ref} onScroll={upd}>
          {movies.map((m,i)=><Card key={\`\${m.id}-\${i}\`} movie={m} onOpen={onOpen} rank={rank?i+1:null}/>)}
        </div>
        {cr&&<button className="arr ar" onClick={()=>scroll(1)}><ChevronRight size={22}/></button>}
      </div>
    </section>
  );
}
`;

appendFileSync('src/pages/HomePage.jsx', p2);
console.log('Part 2 done');
