import { appendFileSync } from 'fs';

const css = `
const CSS = \`
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
.nb.sc{background:rgba(9,9,9,.97);backdrop-filter:blur(22px);border-color:var(--bdr);}
.nb:not(.sc){background:linear-gradient(to bottom,rgba(0,0,0,.8),transparent);}
.nb-l{display:flex;align-items:center;gap:24px;}
.logo{display:flex;align-items:baseline;cursor:pointer;user-select:none;}
.ln{font-family:'Bebas Neue',sans-serif;font-size:30px;color:var(--red);letter-spacing:-1px;}
.le{font-family:'Bebas Neue',sans-serif;font-size:26px;color:#fff;letter-spacing:1px;}
.nl{display:flex;gap:4px;list-style:none;}
.nl li{position:relative;font-size:13px;font-weight:500;cursor:pointer;color:rgba(255,255,255,.65);padding:7px 9px;transition:color .2s;white-space:nowrap;}
.nl li:hover,.nl li.act{color:#fff;}
.nul{position:absolute;bottom:2px;left:9px;right:9px;height:2px;background:var(--red);border-radius:2px;transform:scaleX(0);transform-origin:left;transition:transform .28s cubic-bezier(.4,0,.2,1);pointer-events:none;}
.nul.vis,.nul.perm{transform:scaleX(1);}
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
.hbg{display:none;background:none;border:none;color:#fff;cursor:pointer;}
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
.hbg{position:absolute;inset:0;background-size:cover;background-position:center top;animation:hz 8s ease-in-out forwards;transform:scale(1.06);}
@keyframes hz{from{transform:scale(1.06)}to{transform:scale(1)}}
.hvig{position:absolute;inset:0;background:linear-gradient(to right,rgba(0,0,0,.88) 0%,rgba(0,0,0,.35) 55%,transparent 100%);}
.hfade{position:absolute;bottom:0;left:0;right:0;height:42%;background:linear-gradient(to top,var(--bg),transparent);}
.hcnt{position:absolute;bottom:18%;left:4%;max-width:530px;animation:hup .85s cubic-bezier(.16,1,.3,1) both;}
@keyframes hup{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
.hbdg{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:700;letter-spacing:2px;color:var(--red);background:rgba(229,9,20,.1);border:1px solid rgba(229,9,20,.28);padding:4px 12px;border-radius:20px;margin-bottom:12px;}
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
.rscr{display:flex;gap:6px;overflow-x:auto;padding:10px 0 22px;scrollbar-width:none;scroll-snap-type:x mandatory;}
.rscr::-webkit-scrollbar{display:none;}
.arr{position:absolute;top:50%;transform:translateY(-50%);z-index:10;background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.18);color:#fff;width:40px;height:var(--ch);max-height:124px;border-radius:4px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;backdrop-filter:blur(8px);}
.arr:hover{background:rgba(20,20,20,.95);}
.al{left:-2px;}.ar{right:-2px;}
.card{position:relative;flex-shrink:0;width:var(--cw);cursor:pointer;scroll-snap-align:start;transition:transform .32s cubic-bezier(.34,1.56,.64,1),z-index 0s .32s;border-radius:5px;overflow:hidden;}
.chov{transform:scale(1.26) translateY(-7px);z-index:100;transition:transform .32s cubic-bezier(.34,1.56,.64,1),z-index 0s;box-shadow:0 20px 44px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.08);}
.cib{width:100%;height:var(--ch);overflow:hidden;position:relative;border-radius:5px 5px 0 0;}
.card:not(.chov) .cib{border-radius:5px;}
.cimg{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s;}
.chov .cimg{transform:scale(1.06);}
.csm{position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.06) 50%,transparent 65%);opacity:0;transition:opacity .3s;pointer-events:none;}
.chov .csm{opacity:1;}
.cgr{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.8) 0%,transparent 60%);}
.crat{position:absolute;bottom:7px;left:8px;display:flex;align-items:center;gap:3px;font-size:11px;font-weight:700;color:var(--yel);}
.rnk{position:absolute;top:6px;left:7px;font-family:'Bebas Neue',sans-serif;font-size:38px;color:rgba(255,255,255,.9);line-height:1;text-shadow:2px 2px 0 rgba(0,0,0,.88),-1px -1px 0 rgba(0,0,0,.5);z-index:5;}
.chov-c{background:var(--s2);padding:9px 11px 11px;display:none;border-radius:0 0 5px 5px;}
.chov .chov-c{display:block;}
.cname{font-size:13px;font-weight:700;margin-bottom:7px;}
.cacts{display:flex;align-items:center;gap:5px;margin-bottom:7px;}
.caplay{background:#fff;border:none;color:#000;width:27px;height:27px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s;}
.caplay:hover{transform:scale(1.1);}
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
  .nl{display:none;}.hbg{display:flex;}.an{display:none;}
  .hcnt{left:5%;right:5%;max-width:100%;}
  .mbg{grid-template-columns:1fr;}
  .msimg{grid-template-columns:repeat(2,1fr);}
  .stg{grid-template-columns:repeat(2,1fr);}
  .pew{flex-direction:column;}
}
\`;
`;

appendFileSync('src/pages/HomePage.jsx', css);
console.log('CSS part done');
