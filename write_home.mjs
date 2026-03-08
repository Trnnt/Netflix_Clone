import { writeFileSync, appendFileSync } from 'fs';

const p1 = `import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Info, Plus, ThumbsUp, Bell, Search, ChevronLeft, ChevronRight, X, Volume2, VolumeX, Star, Clock, Download, Share2, Bookmark, Film, User, Settings, LogOut, Menu, Sparkles, Check } from "lucide-react";

const MOVIES = [
  { id:1,  title:"Demon Slayer",    year:"2023", maturity:"TV-14", match:97, episodes:"3 Seasons",   desc:"A kindhearted boy joins the Demon Slayer Corps to find a cure for his sister, who was transformed into a demon.", backdrop:"https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&q=80", cast:"Natsuki Hanae, Akari Kito",        genre:"Anime",     tags:["Anime","Action","Adventure","Fantasy"], rating:8.7, duration:"24 min" },
  { id:2,  title:"Interstellar",    year:"2014", maturity:"PG-13", match:98, episodes:"2h 49m",      desc:"A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.",              backdrop:"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80", cast:"Matthew McConaughey, Anne Hathaway", genre:"Hollywood", tags:["Sci-Fi","Drama","Adventure"],           rating:8.6, duration:"2h 49m" },
  { id:3,  title:"Squid Game",      year:"2021", maturity:"TV-MA", match:96, episodes:"2 Seasons",   desc:"Hundreds of cash-strapped players accept a strange invitation to compete in children games.",                   backdrop:"https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80", cast:"Lee Jung-jae, Park Hae-soo",       genre:"K-Drama",   tags:["K-Drama","Thriller","Survival"],         rating:8.0, duration:"55 min" },
  { id:4,  title:"Attack on Titan", year:"2023", maturity:"TV-MA", match:99, episodes:"4 Seasons",   desc:"Humans live behind enormous walls to protect themselves from the Titans, mysterious giants who devour humans.",   backdrop:"https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=400&q=80", cast:"Yuki Kaji, Marina Inoue",          genre:"Anime",     tags:["Anime","Action","Dark Fantasy"],         rating:9.0, duration:"24 min" },
  { id:5,  title:"Oppenheimer",     year:"2023", maturity:"R",     match:95, episodes:"3h",          desc:"The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",        backdrop:"https://images.unsplash.com/photo-1541233349642-6e425fe6190e?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1541233349642-6e425fe6190e?w=400&q=80", cast:"Cillian Murphy, Emily Blunt",      genre:"Hollywood", tags:["Drama","Biography","History"],           rating:8.9, duration:"3h"     },
  { id:6,  title:"The Crown",       year:"2023", maturity:"TV-MA", match:92, episodes:"6 Seasons",   desc:"Follows the political rivalries and romance of Queen Elizabeth II reign.",                                      backdrop:"https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&q=80", cast:"Claire Foy, Olivia Colman",        genre:"Hollywood", tags:["Drama","Biography","History"],           rating:8.7, duration:"58 min" },
  { id:7,  title:"One Piece",       year:"2023", maturity:"TV-14", match:94, episodes:"Live Action",  desc:"A young man gains rubber powers after eating a Devil Fruit and sets out to become King of the Pirates.",         backdrop:"https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=400&q=80", cast:"Inaki Godoy, Mackenyu",            genre:"Anime",     tags:["Anime","Adventure","Action"],            rating:8.4, duration:"60 min" },
  { id:8,  title:"Wednesday",       year:"2022", maturity:"TV-14", match:93, episodes:"2 Seasons",   desc:"Wednesday Addams investigates a murder spree while making new friends at Nevermore Academy.",                    backdrop:"https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&q=80", cast:"Jenna Ortega, Gwendoline Christie", genre:"Hollywood", tags:["Horror","Comedy","Mystery"],             rating:8.1, duration:"45 min" },
  { id:9,  title:"Bling Empire",    year:"2021", maturity:"TV-MA", match:88, episodes:"3 Seasons",   desc:"Young, rich Asians in Los Angeles open their world of opulence and edge.",                                       backdrop:"https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80", cast:"Anna Shay, Kane Lim",              genre:"C-Drama",   tags:["C-Drama","Reality","Lifestyle"],          rating:7.2, duration:"40 min" },
  { id:10, title:"Wakfu",           year:"2023", maturity:"TV-Y7", match:90, episodes:"4 Seasons",   desc:"A young boy discovers he has mysterious powers and sets out on a grand magical adventure.",                      backdrop:"https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80", cast:"Various",                          genre:"Cartoon",   tags:["Cartoon","Adventure","Fantasy"],          rating:8.5, duration:"26 min" },
  { id:11, title:"DDLJ",            year:"1995", maturity:"G",     match:96, episodes:"3h 9m",       desc:"A young man and woman fall in love on a trip through Europe, but the girl is already betrothed.",                backdrop:"https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1518002054494-3a6f94352e9d?w=400&q=80", cast:"Shah Rukh Khan, Kajol",            genre:"Wollywood", tags:["Wollywood","Romance","Drama"],            rating:8.1, duration:"3h 9m" },
  { id:12, title:"Midnight Diner",  year:"2021", maturity:"TV-14", match:91, episodes:"3 Seasons",   desc:"A chef runs a small diner open only from midnight to 7am, serving just one dish.",                              backdrop:"https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1600&q=80", thumbnail:"https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&q=80", cast:"Kaoru Kobayashi",                  genre:"J-Drama",   tags:["J-Drama","Slice of Life","Drama"],         rating:8.3, duration:"25 min" },
];

const ROWS = {
  trending:  MOVIES,
  hollywood: MOVIES.filter(m=>m.genre==="Hollywood"),
  anime:     MOVIES.filter(m=>m.genre==="Anime"),
  kdrama:    MOVIES.filter(m=>m.genre==="K-Drama"),
  cdrama:    MOVIES.filter(m=>m.genre==="C-Drama"),
  jdrama:    MOVIES.filter(m=>m.genre==="J-Drama"),
  wollywood: MOVIES.filter(m=>m.genre==="Wollywood"),
  cartoon:   MOVIES.filter(m=>m.genre==="Cartoon"),
  picks:     [...MOVIES].sort(()=>Math.random()-0.5),
};

const GENRES = [
  {label:"Anime",key:"anime",emoji:"🗡️"},
  {label:"Cartoon",key:"cartoon",emoji:"🎨"},
  {label:"Hollywood",key:"hollywood",emoji:"🎬"},
  {label:"Wollywood",key:"wollywood",emoji:"🎭"},
  {label:"K-Drama",key:"kdrama",emoji:"🌸"},
  {label:"C-Drama",key:"cdrama",emoji:"🐉"},
  {label:"J-Drama",key:"jdrama",emoji:"⛩️"},
];

const NAV_ITEMS = ["Home","Anime","Cartoon","Hollywood","Wollywood","K-Drama","C-Drama","J-Drama"];

function Particles(){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current,ctx=c.getContext("2d");let id;
    const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};
    resize();window.addEventListener("resize",resize);
    const pts=Array.from({length:65},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:Math.random()*1.3+0.3,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,a:Math.random()*.4+.1}));
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height);
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=c.width;if(p.x>c.width)p.x=0;if(p.y<0)p.y=c.height;if(p.y>c.height)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=\`rgba(229,9,20,\${p.a})\`;ctx.fill();});
      pts.forEach((p,i)=>pts.slice(i+1).forEach(q=>{const d=Math.hypot(p.x-q.x,p.y-q.y);if(d<90){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.strokeStyle=\`rgba(229,9,20,\${.07*(1-d/90)})\`;ctx.lineWidth=.4;ctx.stroke();}}));
      id=requestAnimationFrame(draw);
    };draw();
    return()=>{cancelAnimationFrame(id);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",opacity:.5}}/>;
}

const Aurora=()=>(<div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}><div className="au1"/><div className="au2"/><div className="au3"/></div>);
`;
writeFileSync('src/pages/HomePage.jsx', p1);
console.log('Part 1 done, size:', p1.length);
