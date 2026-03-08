import { appendFileSync } from 'fs';

const p4 = `
export default function HomePage({setIsLoggedIn}){
  const [scrolled,setScrolled]=useState(false);
  const [query,setQuery]=useState("");
  const [cat,setCat]=useState("Home");
  const [activeGenre,setActiveGenre]=useState(null);
  const [modal,setModal]=useState(null);
  const [settingsModal,setSettingsModal]=useState(null);
  const [heroIdx,setHeroIdx]=useState(0);
  const [heroKey,setHeroKey]=useState(0);
  const timerRef=useRef(null);

  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>20);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);
  const advance=useCallback(()=>{setHeroIdx(i=>(i+1)%Math.min(MOVIES.length,5));setHeroKey(k=>k+1);},[]);
  useEffect(()=>{timerRef.current=setInterval(advance,8000);return()=>clearInterval(timerRef.current);},[advance]);

  const handleCat=c=>{setCat(c);setActiveGenre(null);};

  const getRows=()=>{
    if(activeGenre){const g=GENRES.find(x=>x.key===activeGenre);return[{title:\`\${g.emoji} \${g.label}\`,movies:ROWS[activeGenre]||[],rank:false}];}
    if(cat==="Home")return[
      {title:"🔥 Trending Now",movies:ROWS.trending,rank:true},
      {title:"🎬 Hollywood",movies:ROWS.hollywood},
      {title:"🗡️ Anime",movies:ROWS.anime},
      {title:"🌸 K-Dramas",movies:ROWS.kdrama},
      {title:"🎨 Cartoons",movies:ROWS.cartoon},
      {title:"🎭 Wollywood",movies:ROWS.wollywood},
      {title:"🐉 C-Dramas",movies:ROWS.cdrama},
      {title:"⛩️ J-Dramas",movies:ROWS.jdrama},
      {title:"✨ Top Picks",movies:ROWS.picks},
    ];
    const km={Anime:"anime",Cartoon:"cartoon",Hollywood:"hollywood",Wollywood:"wollywood","K-Drama":"kdrama","C-Drama":"cdrama","J-Drama":"jdrama"};
    return[{title:cat,movies:ROWS[km[cat]]||ROWS.trending}];
  };

  return(
    <>
    <style>{CSS}</style>
    <div className="root">
      <Aurora/><Particles/>
      <Navbar scrolled={scrolled} category={cat} setCategory={handleCat} onSearch={setQuery} setActiveModal={setSettingsModal} setLoggedIn={setIsLoggedIn}/>
      {query.trim()?(
        <div style={{paddingTop:100,position:"relative",zIndex:2}}><SearchPage query={query} onOpen={setModal}/></div>
      ):(
        <>
          <Hero key={heroKey} movie={MOVIES[heroIdx]} onOpen={setModal}/>
          <div style={{position:"relative",zIndex:2}}>
            <GenreStrip active={activeGenre} setActive={setActiveGenre}/>
            <main style={{paddingBottom:80}}>{getRows().map((r,i)=><Row key={i} title={r.title} movies={r.movies} onOpen={setModal} rank={r.rank}/>)}</main>
          </div>
        </>
      )}
      {modal&&<MovieModal movie={modal} onClose={()=>setModal(null)}/>}
      {settingsModal==="profile"&&<ProfileModal onClose={()=>setSettingsModal(null)}/>}
      {settingsModal==="mylist"&&<MyListModal onClose={()=>setSettingsModal(null)}/>}
      {settingsModal==="downloads"&&<DownloadsModal onClose={()=>setSettingsModal(null)}/>}
      {settingsModal==="settings"&&<SettingsModal onClose={()=>setSettingsModal(null)}/>}
    </div>
    </>
  );
}
`;

appendFileSync('src/pages/HomePage.jsx', p4);
console.log('Part 4 done');
