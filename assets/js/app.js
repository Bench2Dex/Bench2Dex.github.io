/* BENCH2DEX homepage interactions and rendering. */
(function(){
  "use strict";
  const B = window.BENCH;
  const $ = (s,p=document)=>p.querySelector(s);
  const $$ = (s,p=document)=>Array.from(p.querySelectorAll(s));
  const el = (tag,cls,html)=>{const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e;};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n,d=0)=>Number(n).toFixed(d);
  const pct = (n,d=1)=>fmt(n*100,d)+"%";

  /* ---------- Proof strip ---------- */
  (function(){
    const g = $("#proof-grid");
    if(!g) return;
    const select = cell=>{
      $$(".proof-cell",g).forEach(item=>{
        const active=item===cell;
        item.classList.toggle("selected",active);
        item.setAttribute("aria-pressed",active?"true":"false");
      });
    };
    B.PROOF_STATS.forEach(s=>{
      const c = el("div","proof-cell");
      c.tabIndex=0;
      c.setAttribute("role","button");
      c.setAttribute("aria-label",`${s.n} ${s.label}. ${s.tip}`);
      c.setAttribute("aria-pressed","false");
      c.innerHTML = `<div class="n">${s.n}</div><div class="l">${s.label}</div><div class="q">${s.sub}</div><div class="proof-tip">${s.tip}</div>`;
      c.addEventListener("click",()=>select(c));
      c.addEventListener("keydown",event=>{
        if(event.key==="Enter"||event.key===" "){
          event.preventDefault();
          select(c);
        }
      });
      g.appendChild(c);
    });
  })();

  /* ---------- Nav: solid state, scroll-spy, progress, drawer ---------- */
  (function(){
    const nav=$("#nav"), burger=$("#burger"), drawer=$("#drawer"), progress=$("#nav-progress"), drawerClose=$("#drawer-close");
    const onScroll=()=>{
      nav.classList.toggle("solid", window.scrollY>20);
      const h=document.documentElement.scrollHeight-window.innerHeight;
      progress.style.width = (h>0 ? Math.min(100,(window.scrollY/h*100)) : 0)+"%";
      spy();
    };
    const setDrawer=open=>{ drawer.classList.toggle("open",open); burger.setAttribute("aria-expanded",open?"true":"false"); };
    burger.addEventListener("click",()=>setDrawer(!drawer.classList.contains("open")));
    if(drawerClose) drawerClose.addEventListener("click",()=>setDrawer(false));
    $$(".drawer a").forEach(a=>a.addEventListener("click",()=>setDrawer(false)));
    document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&drawer.classList.contains("open")) setDrawer(false); });

    const links=$$("#nav-links a");
    const sections=links.map(a=>$(a.getAttribute("href"))).filter(Boolean);
    function spy(){
      const y=window.scrollY+96; let cur=sections[0]?.id;
      for(const s of sections){ if(s && s.offsetTop<=y) cur=s.id; }
      links.forEach(a=>{
        const on=a.getAttribute("href")==="#"+cur;
        a.classList.toggle("active",on);
        if(on) a.setAttribute("aria-current","true"); else a.removeAttribute("aria-current");
      });
    }
    window.addEventListener("scroll",onScroll,{passive:true}); onScroll();
  })();

  /* ---------- Comparison matrix: persistent row selection ---------- */
  (function(){
    const rows=$$(".bm-table tbody tr");
    if(!rows.length) return;
    const select=row=>{
      rows.forEach(item=>{
        const active=item===row;
        item.classList.toggle("selected",active);
        item.setAttribute("aria-selected",active?"true":"false");
      });
    };
    rows.forEach(row=>{
      row.tabIndex=0;
      row.setAttribute("aria-label",`Highlight ${row.cells[0]?.textContent.trim()||"this benchmark"} across the comparison matrix`);
      row.setAttribute("aria-selected","false");
      row.addEventListener("click",()=>select(row));
      row.addEventListener("keydown",event=>{
        if(event.key==="Enter"||event.key===" "){
          event.preventDefault();
          select(row);
        }
      });
    });
  })();

  /* ---------- Tasks: data helpers ---------- */
  const embById = id => B.EMBODIMENTS.find(e=>e.id===id);
  const tagClass = t => ({ "tool-use":"tool", "tool":"tool", "striking":"tool", "articulated":"art", "long-horizon":"long", "temporal-sequence":"long" }[t]||"");
  const tagLabel = t => ({
    "articulated":"Articulated object", "bimanual":"Bimanual coordination", "carry":"Transport",
    "contact-rich":"Contact-rich", "disposal":"Disposal", "fine-bimanual":"Fine bimanual control",
    "handover":"Inter-hand handover", "heterogeneous":"Multi-device interaction", "interface":"Desk interface",
    "loading":"Container loading", "long-horizon":"Long-horizon", "nested":"Nested placement",
    "placement":"Object placement", "pouring":"Pouring", "precise-assembly":"Precision assembly",
    "scooping":"Scooping", "sequential":"Sequential interaction", "sorting":"Sorting",
    "spherical":"Spherical-object handling", "stabilize":"Stabilization", "striking":"Striking",
    "temporal-sequence":"Temporal sequence", "tool-use":"Tool use", "tray":"Tray arrangement",
    "upright-constraint":"Upright constraint"
  }[t] || t);
  const FEATURED_IDS=["34","12","44","76","79","80"];
  function featuredSet(){
    return FEATURED_IDS.map(id=>B.TASKS.find(t=>t.id===id));
  }
  function taskCard(t){
    const emb=embById(t.emb);
    const featured=FEATURED_IDS.includes(t.id);
    const c=el("div","task-card"+(featured?" featured":""));
    c.dataset.id=t.id;
    c.innerHTML=`
      <div class="thumb poster-ph">
        ${featured?`<span class="featured-badge">★ Featured</span>`:""}
        <img src="assets/img/tasks/${t.id}.png" alt="${t.name}" loading="lazy">
      </div>
      <div class="body">
        <div class="tid"><span class="emb">${emb?emb.name:'—'}</span></div>
        <h3>${t.name}</h3>
        <p class="goal">${t.desc}</p>
        <div class="stage-mini">${t.stages.map(()=>`<span class="s"></span>`).join("")}</div>
        <div class="task-tags">${t.tags.map(x=>`<span class="t ${tagClass(x)}">${tagLabel(x)}</span>`).join("")}</div>
      </div>`;
    c.addEventListener("click",()=>openModal(t));
    return c;
  }

  /* ---------- Task modal ---------- */
  function channelVals(t){
    const r=B.RESULTS[t.id]; if(!r) return [];
    return B.POLICIES.map(p=>{
      const a=B.aggregate(p, "none"); // baseline total
      return { policy:p, vals:r[p] };
    });
  }
  function openModal(t){
    const ov=el("div","modal-overlay"); const emb=embById(t.emb);
    const ch = (["none","equi","inv","full"]);
    const gr00t = B.RESULTS[t.id]?.GR00T;
    ov.innerHTML=`
      <div class="modal modal--duo">
        <div class="modal-clip modal-clip--media">
          <video class="task-front-video" src="assets/video/tasks/${t.id}.mp4" autoplay muted loop playsinline preload="auto" controls aria-label="${t.name} front-view replay"></video>
          <button class="modal-close" aria-label="Close">×</button>
          <span class="hero-badge" style="top:14px;left:14px;">Front view</span>
        </div>
        <div class="modal-link" aria-hidden="true"></div>
        <div class="modal-clip modal-clip--body">
          <div class="modal-title"><h2>${t.name}</h2></div>
          <div class="modal-emb">${emb?emb.name:'—'} · ${t.stages.length} stages</div>

          <div class="modal-section">
            <h4>Task description</h4>
            <p>${t.desc}</p>
          </div>
          <div class="modal-section">
            <h4>Executable success condition</h4>
            <p>${t.success}</p>
          </div>
          <div class="modal-section">
            <h4>Stage timeline</h4>
            <div class="modal-stages">${t.stages.map((s,i)=>`<div class="st"><span style="color:var(--cyan)">${String(i+1).padStart(2,"0")}</span> · ${s}</div>`).join("")}</div>
          </div>
          <div class="modal-section">
            <h4>Reported successes (GR00T N1.5, out of 50)</h4>
            <div class="modal-channels">
              ${ch.map((c,i)=>`<div class="ch"><div class="lab">${B.CHANNEL_LABEL[c]}</div><div class="v">${gr00t?gr00t[i]:'—'}<small> / 50</small></div></div>`).join("")}
            </div>
          </div>
          <div class="modal-section">
            <h4>Website navigation labels</h4>
            <div class="task-tags" style="margin-top:4px;">${t.tags.map(x=>`<span class="t ${tagClass(x)}">${tagLabel(x)}</span>`).join("")}</div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(()=>ov.classList.add("open"));
    const close=()=>{ ov.classList.remove("open"); setTimeout(()=>ov.remove(),250); };
    $(".modal-close",ov).addEventListener("click",close);
    ov.addEventListener("click",e=>{ if(e.target===ov) close(); });
    document.addEventListener("keydown",function esc(e){ if(e.key==="Escape"){close(); document.removeEventListener("keydown",esc);} });
  }

  /* ---------- Filters + grid ---------- */
  (function(){
    // all 26 tasks in one grid; the filter chips below control it
    const ag=$("#all-tasks");
    // Render in the same embodiment-grouped order as the results table
    // (EMBODIMENTS -> e.tasks), so the explorer mirrors the paper table.
    B.EMBODIMENTS.forEach(e=>e.tasks.forEach(tid=>{const t=B.TASKS.find(x=>x.id===tid); if(t) ag.appendChild(taskCard(t));}));
    const FR=$("#task-filters");
    const facets=[
      {k:"all",label:"All 26"},
      {k:"tool-use",label:"Tool use"},
      {k:"articulated",label:"Articulated"},
      {k:"long-horizon",label:"Long-horizon"},
      {k:"bimanual",label:"Bimanual"},
      {k:"pouring",label:"Pouring"},
      {k:"sorting",label:"Sorting"},
      {k:"loading",label:"Loading"},
    ];
    facets.forEach(f=>{
      const b=el("button","filter-chip"+(f.k==="all"?" active":""),f.label);
      b.dataset.k=f.k;
      b.addEventListener("click",()=>{
        $$(".filter-chip",FR).forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        $$(".task-card",ag).forEach(card=>{
          const t=B.TASKS.find(x=>x.id===card.dataset.id);
          const show=f.k==="all"||t.tags.includes(f.k);
          card.style.display= show?"":"none";
        });
      });
      FR.appendChild(b);
    });
  })();

  /* ---------- Synchronized multi-view video player ---------- */
  (function(){
    const fmt=t=>{ if(!isFinite(t)||t<0) t=0; const m=Math.floor(t/60),s=Math.floor(t%60); return m+":"+String(s).padStart(2,"0"); };
    document.querySelectorAll("[data-syncplayer]").forEach(sp=>{
      const videos=[...sp.querySelectorAll(".sync-tile video")];
      const playBtn=sp.querySelector(".sync-play"), seek=sp.querySelector(".sync-seek"), timeEl=sp.querySelector(".sync-time");
      if(!videos.length) return;
      const leader=videos[0];
      let playing=false, raf=null, seeking=false;
      const maxDur=()=>Math.max(0,...videos.map(v=>v.duration||0));
      const updateTime=()=>{ const d=maxDur(); if(timeEl) timeEl.textContent=fmt(leader.currentTime)+" / "+fmt(d); if(seek&&!seeking&&d>0) seek.value=Math.round(leader.currentTime/d*1000); };
      const syncAll=()=>{ const t=leader.currentTime; videos.forEach(v=>{ if(v!==leader && Math.abs((v.currentTime||0)-t)>0.12) { try{ v.currentTime=t; }catch(e){} } }); };
      const playAll=async()=>{ try{ await Promise.all(videos.map(v=>{ const p=v.play(); return p&&p.catch? p.catch(()=>{}):p; })); }catch(e){} };
      const pauseAll=()=>videos.forEach(v=>v.pause());
      const setPlaying=p=>{ playing=p; if(playBtn){ playBtn.textContent=p?"⏸":"▶"; playBtn.setAttribute("aria-label",p?"Pause synchronized views":"Play synchronized views"); } if(p){ playAll(); raf=requestAnimationFrame(loop); } else { pauseAll(); if(raf) cancelAnimationFrame(raf); } };
      function loop(){ if(!playing) return; syncAll(); updateTime(); if(leader.ended){ setPlaying(false); if(seek) seek.value=0; } else raf=requestAnimationFrame(loop); }
      if(playBtn) playBtn.addEventListener("click",()=>setPlaying(!playing));
      if(seek) seek.addEventListener("input",()=>{ seeking=true; const d=maxDur(); const t=(+seek.value)/1000*d; videos.forEach(v=>{ try{ v.currentTime=t; }catch(e){} }); updateTime(); setTimeout(()=>seeking=false,80); });
      videos.forEach(v=>{ v.addEventListener("loadedmetadata",updateTime); v.addEventListener("timeupdate",updateTime); });
      updateTime();
    });
  })();

  /* ---------- Embodiment atlas: all 12 shown as a static grid ---------- */
  (function(){
    const grid=$("#atlas-grid"); if(!grid) return;
    B.EMBODIMENTS.forEach(e=>{
      const c=el("div","atlas-card");
      c.innerHTML=`
        <div class="render"><img src="assets/img/renders/${e.render}.png" alt="${e.name} render" loading="lazy"></div>
        <div class="info">
          <h3>${e.name}</h3>
          <div class="specs">
            <div><span class="k">Arm</span>${e.arm}</div>
            <div><span class="k">Hand</span>${e.hand}</div>
          </div>
        </div>`;
      grid.appendChild(c);
    });
  })();

  /* ---------- Synchronized 8-modality video player ---------- */
  (function(){
    const fmt=t=>{ if(!isFinite(t)||t<0) t=0; const m=Math.floor(t/60),s=Math.floor(t%60); return m+":"+String(s).padStart(2,"0"); };
    const sp=document.querySelector("[data-modalplayer]"); if(!sp) return;
    const manifest=sp.dataset.manifest;
    const grid=sp.querySelector(".modal-grid"), playBtn=sp.querySelector(".mp-play"), seek=sp.querySelector(".mp-seek"), timeEl=sp.querySelector(".mp-frame");
    let videos=[], leader=null, playing=false, raf=null, seeking=false;
    const maxDur=()=>Math.max(0,...videos.map(v=>v.duration||0));
    const updateTime=()=>{ const d=maxDur(); const t=leader?leader.currentTime:0; if(timeEl) timeEl.textContent=fmt(t)+" / "+fmt(d); if(seek&&!seeking&&d>0) seek.value=Math.round(t/d*1000); };
    const syncAll=()=>{ if(!leader) return; const t=leader.currentTime; videos.forEach(v=>{ if(v!==leader && Math.abs((v.currentTime||0)-t)>0.1){ try{ v.currentTime=t; }catch(e){} } }); };
    const playAll=async()=>{ try{ await Promise.all(videos.map(v=>{ const p=v.play(); return p&&p.catch? p.catch(()=>{}):p; })); }catch(e){} };
    const pauseAll=()=>videos.forEach(v=>v.pause());
    function setPlaying(p){
      playing=p; if(playBtn){ playBtn.textContent=p?"⏸":"▶"; playBtn.setAttribute("aria-label",p?"Pause synchronized modalities":"Play synchronized modalities"); }
      if(p){ playAll(); raf=requestAnimationFrame(loop); } else { pauseAll(); if(raf) cancelAnimationFrame(raf); }
    }
    function loop(){ if(!playing||!leader) return; syncAll(); updateTime(); if(leader.ended){ setPlaying(false); if(seek) seek.value=0; videos.forEach(v=>{ try{ v.currentTime=0; }catch(e){} }); updateTime(); } else raf=requestAnimationFrame(loop); }
    const inline=document.getElementById("modal-manifest");
    const dataPromise = inline ? Promise.resolve(JSON.parse(inline.textContent.trim())) : fetch(manifest).then(r=>r.json());
    dataPromise.then(m=>{
      const vdir=m.video_dir||"assets/video/modal"; const labels=m.labels||{};
      const revision=m.asset_revision?`?v=${encodeURIComponent(m.asset_revision)}`:"";
      grid.innerHTML=m.modalities.map(mod=>`<figure class="mtile"><video src="${vdir}/${mod}.mp4${revision}" poster="${vdir}/${mod}_poster.png${revision}" data-mod="${mod}" muted playsinline preload="metadata" aria-label="${labels[mod]||mod}"></video><figcaption>${labels[mod]||mod}</figcaption></figure>`).join("");
      videos=[...grid.querySelectorAll("video")]; if(!videos.length) return;
      leader=videos[0];
      if(seek){ seek.max=1000; seek.value=0; }
      videos.forEach(v=>{ v.addEventListener("loadedmetadata",updateTime); v.addEventListener("timeupdate",updateTime); });
      updateTime();
      /* Auto-play the eight synchronized modalities when scrolled into
         view (videos are muted, so autoplay is allowed); pause when scrolled
         away to keep the page light. Respect prefers-reduced-motion. */
      if(!reduceMotion && 'IntersectionObserver' in window){
        const io=new IntersectionObserver(es=>es.forEach(e=>{
          if(e.isIntersecting){ if(!playing) setPlaying(true); }
          else if(playing){ setPlaying(false); }
        }),{threshold:0.3, rootMargin:"0px 0px -10% 0px"});
        io.observe(sp);
      }
    }).catch(()=>{ grid.innerHTML='<p class="data-note">Could not load modal videos. Run <code>tools/export_modal_videos.py</code> to generate synchronized modality videos.</p>'; });
    if(playBtn) playBtn.addEventListener("click",()=> playing?setPlaying(false):setPlaying(true));
    if(seek) seek.addEventListener("input",()=>{ seeking=true; const d=maxDur(); const t=(+seek.value)/1000*d; videos.forEach(v=>{ try{ v.currentTime=t; }catch(e){} }); updateTime(); setTimeout(()=>seeking=false,80); });
  })();

  /* ---------- Tactile interface morphology carousel ---------- */
  (function(){
    const sw=$("#tactile-switch"), imgEl=$("#tactile-img");
    if(!sw||!imgEl) return;
    // four morphology pairs: a render-mesh thumbnail and its 8-bit tactile sample
    const pick=["ur5_shadow_hand","ur5_rh56dfx","kuka_sharpa","xarm_leap"];
    const items=pick.map(key=>{
      const e=B.EMBODIMENTS.find(x=>x.render===key)||B.EMBODIMENTS.find(x=>x.id===key);
      const sample=B.EMBODIMENTS.find(x=>x.id===e.id);
      return {
        name:e.name, hand:e.hand,
        tactile:`assets/img/tactile/${sample.tactile}.png`,
        mesh:`assets/img/contact/${e.contact}_contact.png`,
      };
    });
    let idx=0, timer=null;
    const tiles=items.map((it,i)=>{
      const tile=el("div","tactile-render");
      tile.setAttribute("role","button");
      tile.setAttribute("tabindex","0");
      tile.setAttribute("aria-label",`Show ${it.name} tactile sample`);
      tile.innerHTML=
        `<img src="${it.mesh}" alt="${it.name} contact-surface mesh" loading="lazy">`+
        `<span class="panel-tag mono" style="bottom:8px;left:8px;top:auto;position:absolute">${it.hand}</span>`;
      const go=()=>activate(i,true);
      tile.addEventListener("click",go);
      tile.addEventListener("keydown",ev=>{ if(ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); go(); } });
      sw.appendChild(tile);
      return tile;
    });
    function activate(i,manual,silent){
      const n=items.length;
      idx=(i%n+n)%n;
      const it=items[idx];
      tiles.forEach((t,k)=>t.classList.toggle("active",k===idx));
      if(!silent){
        /* Preload the next tactile sample so the swap fades in seamlessly. */
        imgEl.classList.add("swap");
        const pre=new Image(); pre.src=it.tactile;
        const apply=()=>{ imgEl.src=it.tactile; imgEl.alt=`${it.name} tactile image`; requestAnimationFrame(()=>imgEl.classList.remove("swap")); };
        if(pre.complete) apply(); else { pre.onload=apply; pre.onerror=apply; }
      }
      if(manual && !reduceMotion) restart();
    }
    function restart(){ stop(); timer=setInterval(()=>activate(idx+1,false),3000); }
    function stop(){ if(timer){ clearInterval(timer); timer=null; } }
    activate(0,false,true); /* keep the initial tactile image, mark the first tile active */
    /* Auto-rotate only while the tactile band is on screen; pause when scrolled
       away to keep the page light. Respect prefers-reduced-motion. */
    if(!reduceMotion && 'IntersectionObserver' in window){
      const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) restart(); else stop(); }),{threshold:0.35});
      io.observe(sw);
    }
  })();

  /* ---------- Generalization axis videos: muted-autoplay while in view ---------- */
  (function(){
    const videos=$$(".axis-video");
    if(!videos.length || reduceMotion || !('IntersectionObserver' in window)) return;
    /* Muted looping clips play only while the generalization band is on
       screen, to keep the page light; pause when scrolled away. */
    const io=new IntersectionObserver(es=>es.forEach(e=>{
      const v=e.target;
      if(e.isIntersecting){ if(v.paused) v.play().catch(()=>{}); }
      else if(!v.paused){ v.pause(); }
    }),{threshold:0.25, rootMargin:"0px 0px -10% 0px"});
    videos.forEach(v=>io.observe(v));
  })();

  /* ---------- Evaluation stage progression ---------- */
  (function(){
    const stages=$$("#eval-stages .eval-stage");
    let i=0;
    const tick=()=>{ stages.forEach(s=>s.classList.remove("sat")); for(let k=0;k<=i && k<stages.length;k++) stages[k].classList.add("sat"); i=(i+1)%(stages.length+1); };
    tick();
    if(!reduceMotion) setInterval(tick,1300);
  })();

  /* ---------- Results: aggregate bar chart ---------- */
  function svgEl(t,a){ const e=document.createElementNS("http://www.w3.org/2000/svg",t); for(const k in a) e.setAttribute(k,a[k]); return e; }
  function tipEl(){
    const t=el("div","htooltip"); document.body.appendChild(t); return t;
  }
  const tip=tipEl();
  function showTip(e,html){ tip.innerHTML=html; tip.style.opacity=1; moveTip(e); }
  function moveTip(e){
    const t=e&&e.target;
    const r=(t&&t.getBoundingClientRect)?t.getBoundingClientRect():null;
    if(r){ tip.style.left=Math.min(window.innerWidth-264, r.left+12)+"px"; tip.style.top=Math.max(8, r.top-8-tip.offsetHeight)+"px"; }
    else if(e&&typeof e.clientX==="number"){ tip.style.left=Math.min(window.innerWidth-264, e.clientX+14)+"px"; tip.style.top=Math.max(8, e.clientY-8-tip.offsetHeight)+"px"; }
  }
  function hideTip(){ tip.style.opacity=0; }

  (function(){
    const wrap=$("#chart-aggregate"); if(!wrap) return;
    const W=860,H=380, M={l:46,r:22,t:54,b:58};
    const svg=svgEl("svg",{viewBox:`0 0 ${W} ${H}`,width:"100%"});
    const policies=["GR00T","PI05","ACT","DPC"]; // strongest first
    const maxScale=0.50;                 // fixed 0–50% scale (None maximum: 48.5%)
    const plotW=W-M.l-M.r, plotH=H-M.t-M.b;
    const baseline=M.t+plotH;
    const groupW=plotW/policies.length;
    const colW=30, colGap=6, setW=4*colW+3*colGap;
    const yOf=v=>baseline - v/maxScale*plotH;
    // y gridlines + ticks (0,10,...,50)
    [0,.1,.2,.3,.4,.5].forEach(g=>{
      const y=M.t+plotH-g/maxScale*plotH;
      svg.appendChild(svgEl("line",{x1:M.l,y1:y,x2:M.l+plotW,y2:y,stroke:g===0?"#C9C0AC":"#EDE7D8","stroke-width":1}));
      svg.appendChild(Object.assign(svgEl("text",{x:M.l-8,y:y+4,fill:"#8B9089","font-family":"Azeret Mono","font-size":10.5,"text-anchor":"end"}),{textContent:(g*100)+"%"}));
    });
    // y-axis title
    svg.appendChild(Object.assign(svgEl("text",{x:M.l-30,y:M.t-20,fill:"#8B9089","font-family":"Azeret Mono","font-size":10.5,"text-anchor":"start",transform:"rotate(-90 "+(M.l-30)+" "+(M.t-20)+")"}),{textContent:"stable SR"}));
    // legend (top)
    B.CHANNELS.forEach((c,i)=>{
      const x=M.l+i*78;
      svg.appendChild(svgEl("rect",{x,y:M.t-24,width:11,height:11,rx:2,fill:B.CHANNEL_COLOR[c]}));
      svg.appendChild(Object.assign(svgEl("text",{x:x+16,y:M.t-14,fill:"#2A322F","font-family":"Azeret Mono","font-size":11}),{textContent:B.CHANNEL_LABEL[c]}));
    });
    // groups
    policies.forEach((p,i)=>{
      const gx=M.l+i*groupW;
      const setLeft=gx+(groupW-setW)/2;
      B.CHANNELS.forEach((c,ci)=>{
        const a=B.aggregate(p,c);
        const cx=setLeft+ci*(colW+colGap);
        const h=Math.max(1,a.sr/maxScale*plotH);
        const y=yOf(a.sr);
        const r=svgEl("rect",{x:cx,y:y,width:colW,height:h,rx:3,fill:B.CHANNEL_COLOR[c]});
        r.style.cursor="default";
        r.addEventListener("mouseenter",e=>showTip(e,`<div style="font-weight:600;color:#15201E">${B.POLICY_LABEL[p]} · ${B.CHANNEL_LABEL[c]}</div><div style="margin-top:3px">${a.sum} / ${a.total} successes = <b>${pct(a.sr,1)}</b></div><div style="color:#58615E;font-size:11px;margin-top:2px">task-macro = pooled SR · 1,300 rollouts</div>`));
        r.addEventListener("mousemove",e=>moveTip(e));
        r.addEventListener("mouseleave",hideTip);
        svg.appendChild(r);
        // value label above column
        svg.appendChild(Object.assign(svgEl("text",{x:cx+colW/2,y:y-5,fill:"#58615E","font-family":"Azeret Mono","font-size":9.5,"text-anchor":"middle"}),{textContent:Math.round(a.sr*100)+"%"}));
      });
      // group label
      svg.appendChild(Object.assign(svgEl("text",{x:gx+groupW/2,y:baseline+22,fill:"#15201E","font-family":"system-ui, sans-serif","font-size":15,"text-anchor":"middle","font-weight":600}),{textContent:B.POLICY_LABEL[p]}));
      // None→Full drop annotation: small downward arrow + delta
      const nA=B.aggregate(p,"none"), fA=B.aggregate(p,"full");
      const drop=(nA.sr-fA.sr)*100;
      svg.appendChild(Object.assign(svgEl("text",{x:gx+groupW/2,y:baseline+40,fill:"#8B9089","font-family":"Azeret Mono","font-size":10,"text-anchor":"middle"}),{textContent:"None→Full −"+drop.toFixed(0)+"pp"}));
    });
    svg.appendChild(Object.assign(svgEl("text",{x:M.l+plotW,y:H-8,fill:"#8B9089","font-family":"Azeret Mono","font-size":10.5,"text-anchor":"end"}),{textContent:"equal-weight task-macro SR · 4 channels · 1,300 rollouts per column"}));
    wrap.appendChild(svg);
  })();

  /* ---------- Results: retention chart (None ghost + Full retained overlay) ---------- */
  (function(){
    const wrap=$("#chart-retention"); if(!wrap) return;
    const W=820,H=320,M={l:46,r:22,t:54,b:62};
    const svg=svgEl("svg",{viewBox:`0 0 ${W} ${H}`,width:"100%"});
    const policies=["GR00T","PI05","ACT","DPC"];
    const maxScale=0.50;
    const baseline=M.t+(H-M.t-M.b);
    const plotW=W-M.l-M.r, plotH=H-M.t-M.b;
    const yOf=v=>baseline - v/maxScale*plotH;
    const noneCol="#9AA3A0", fullCol="#6B4FB0";
    const data=policies.map(p=>{
      const n=B.aggregate(p,"none"), f=B.aggregate(p,"full");
      return {p, nSR:n.sr, fSR:f.sr, ret:n.sr>0?f.sr/n.sr:0, nSum:n.sum, fSum:f.sum};
    });
    const groupW=plotW/policies.length, bw=groupW*0.42;
    // gridlines
    [0,.1,.2,.3,.4,.5].forEach(g=>{
      const y=M.t+plotH-g/maxScale*plotH;
      svg.appendChild(svgEl("line",{x1:M.l,y1:y,x2:M.l+plotW,y2:y,stroke:g===0?"#C9C0AC":"#EDE7D8","stroke-width":1}));
      svg.appendChild(Object.assign(svgEl("text",{x:M.l-8,y:y+4,fill:"#8B9089","font-family":"Azeret Mono","font-size":10.5,"text-anchor":"end"}),{textContent:(g*100)+"%"}));
    });
    svg.appendChild(Object.assign(svgEl("text",{x:M.l-30,y:M.t-20,fill:"#8B9089","font-family":"Azeret Mono","font-size":10.5,"text-anchor":"start",transform:"rotate(-90 "+(M.l-30)+" "+(M.t-20)+")"}),{textContent:"stable SR"}));
    // legend
    [
      {x:M.l, lab:"None baseline", fill:"rgba(154,163,160,.22)", stroke:noneCol, dash:"4 3"},
      {x:M.l+128, lab:"Full retained", fill:fullCol, stroke:"none", dash:"none"}
    ].forEach(s=>{
      svg.appendChild(svgEl("rect",{x:s.x,y:M.t-24,width:12,height:11,rx:2,fill:s.fill,stroke:s.stroke,"stroke-width":1.4,"stroke-dasharray":s.dash||undefined}));
      svg.appendChild(Object.assign(svgEl("text",{x:s.x+18,y:M.t-14,fill:"#2A322F","font-family":"Azeret Mono","font-size":11}),{textContent:s.lab}));
    });
    data.forEach((d,i)=>{
      const cx=M.l+i*groupW+groupW/2;
      const nH=Math.max(1,d.nSR/maxScale*plotH);
      const fH=Math.max(1,d.fSR/maxScale*plotH);
      // None baseline ghost: translucent fill + dashed outline
      const ng=svgEl("rect",{x:cx-bw/2,y:baseline-nH,width:bw,height:nH,rx:4,fill:"rgba(154,163,160,.22)",stroke:noneCol,"stroke-width":1.4,"stroke-dasharray":"4 3"});
      ng.addEventListener("mouseenter",e=>showTip(e,`<div style="font-weight:600;color:#15201E">${B.POLICY_LABEL[d.p]}</div><div style="margin-top:3px"><b>None</b> ${d.nSum}/1300 = ${pct(d.nSR,1)}</div><div style="color:#58615E;font-size:11px;margin-top:2px">matched anchor baseline</div>`));
      ng.addEventListener("mousemove",e=>moveTip(e));
      ng.addEventListener("mouseleave",hideTip);
      svg.appendChild(ng);
      // Full retained overlay (solid, sits at bottom within None)
      const fg=svgEl("rect",{x:cx-bw/2,y:baseline-fH,width:bw,height:fH,rx:4,fill:fullCol});
      fg.addEventListener("mouseenter",e=>showTip(e,`<div style="font-weight:600;color:#15201E">${B.POLICY_LABEL[d.p]}</div><div style="margin-top:3px"><b>Full</b> ${d.fSum}/1300 = ${pct(d.fSR,1)}</div><div style="margin-top:3px;color:#6B4FB0">retention ${(d.ret*100).toFixed(0)}% of None</div>`));
      fg.addEventListener("mousemove",e=>moveTip(e));
      fg.addEventListener("mouseleave",hideTip);
      svg.appendChild(fg);
      // None value label (above ghost top)
      svg.appendChild(Object.assign(svgEl("text",{x:cx,y:baseline-nH-6,fill:"#58615E","font-family":"Azeret Mono","font-size":10.5,"text-anchor":"middle"}),{textContent:pct(d.nSR,0)}));
      // Full value label (inside top of violet bar if tall enough, else above)
      const fLabelInside = fH>26;
      svg.appendChild(Object.assign(svgEl("text",{x:cx,y:(fLabelInside?baseline-fH+16:baseline-fH-6),fill:fLabelInside?"#FFFFFF":"#6B4FB0","font-family":"Azeret Mono","font-size":10.5,"text-anchor":"middle","font-weight":600}),{textContent:pct(d.fSR,0)}));
      // policy name + retention pill below
      svg.appendChild(Object.assign(svgEl("text",{x:cx,y:baseline+22,fill:"#15201E","font-family":"system-ui, sans-serif","font-size":15,"text-anchor":"middle","font-weight":600}),{textContent:B.POLICY_LABEL[d.p]}));
      const retPct=(d.ret*100).toFixed(0);
      const pillW=58, pillX=cx-pillW/2, pillY=baseline+32;
      svg.appendChild(svgEl("rect",{x:pillX,y:pillY,width:pillW,height:18,rx:9,fill:"rgba(107,79,176,.12)",stroke:"rgba(107,79,176,.4)","stroke-width":1}));
      svg.appendChild(Object.assign(svgEl("text",{x:cx,y:pillY+13,fill:"#6B4FB0","font-family":"Azeret Mono","font-size":10.5,"text-anchor":"middle","font-weight":600}),{textContent:retPct+"% retained"}));
    });
    svg.appendChild(Object.assign(svgEl("text",{x:M.l+plotW,y:H-8,fill:"#8B9089","font-family":"Azeret Mono","font-size":10.5,"text-anchor":"end"}),{textContent:"filled fraction = Full/None retention · None baseline shown as dashed ghost"}));
    wrap.appendChild(svg);
  })();

  /* ---------- Results: full comparison table (replaces heatmap) ---------- */
  (function(){
    const tbl=$("#results-table");
    if(!tbl) return;
    function cellColor(v){
      const t=Math.max(0,Math.min(1,v/B.ROLLOUTS_PER_CELL));
      const r=Math.round(234+(30-234)*t), g=Math.round(243+(148-243)*t), b=Math.round(244+(166-244)*t);
      return `rgb(${r},${g},${b})`;
    }
    function cell(v){
      const frac=v/B.ROLLOUTS_PER_CELL;
      const color=frac>0.5?"rgba(255,255,255,.92)":"#15201E";
      return `<td class="num" style="background:${cellColor(v)};color:${color}">${v}</td>`;
    }
    function avgPct(counts){ // counts: [none,equi,inv,full]
      const m=(counts[0]+counts[1]+counts[2]+counts[3])/4;
      return m/B.ROLLOUTS_PER_CELL*100;
    }
    function avgCell(counts){
      const v=avgPct(counts);
      return `<td class="avg">${v.toFixed(1)}%</td>`;
    }
    function lscrCell(policy, taskId){
      const value=B.LSCR[taskId][policy];
      return value===null
        ? `<td class="lscr unreported">—</td>`
        : `<td class="lscr">${value.toFixed(1)}%</td>`;
    }
    // header
    const chs=B.CHANNELS;
    let head=`<thead><tr>
      <th rowspan="2" class="th-task">Task</th>
      <th rowspan="2" class="th-emb">Embodiment</th>
      ${B.POLICIES.map(p=>`<th colspan="6" class="th-pol">${B.POLICY_LABEL[p]}</th>`).join("")}
    </tr><tr>
      ${B.POLICIES.map(()=>chs.map(c=>`<th class="th-ch">${B.CHANNEL_LABEL[c]}</th>`).join("")+`<th class="th-ch th-avg">SR</th><th class="th-ch th-lscr">LSCR</th>`).join("")}
    </tr></thead>`;
    // body: group rows by embodiment (EMBODIMENTS order = paper table order)
    const taskById=id=>B.TASKS.find(t=>t.id===id);
    let body="<tbody>";
    B.EMBODIMENTS.forEach((e,gi)=>{
      e.tasks.forEach((tid,ri)=>{
        const t=taskById(tid);
        const r=B.RESULTS[tid];
        const embCell = ri===0 ? `<td class="emb" rowspan="${e.tasks.length}">${e.name}</td>` : "";
        body += `<tr data-tid="${tid}" class="result-row ${ri===0&&gi>0?"grp":""}">
          <td class="task">${t.name}</td>
          ${embCell}
          ${B.POLICIES.map(p=>chs.map((c,ci)=>cell(r[p][ci])).join("")+avgCell(r[p])+lscrCell(p,tid)).join("")}
        </tr>`;
      });
    });
    // Footer: exact paper-reported task-macro SR and all-task mean LSCR.
    body += `<tr class="mean">
      <td colspan="2" class="mean-label">Task mean (%)</td>
      ${B.POLICIES.map(p=>{
        const summary=B.PAPER_SR_SUMMARY[p];
        const srs=summary.slice(0,4);
        const avg=summary[4];
        const lscr=B.LSCR_MEAN[p];
        const lscrHtml=lscr===null ? `<td class="lscr mean-lscr unreported">—</td>` : `<td class="lscr mean-lscr">${lscr.toFixed(1)}%</td>`;
        return srs.map(s=>`<td class="num mean-v">${s.toFixed(1)}%</td>`).join("")+`<td class="avg mean-avg">${avg.toFixed(1)}%</td>`+lscrHtml;
      }).join("")}
    </tr>`;
    body+="</tbody>";
    tbl.innerHTML=head+body;
    const resultRows=$$("tbody tr.result-row",tbl);
    const embodimentCells=$$("tbody td.emb",tbl);
    const embodimentFor=row=>{
      if(row.querySelector("td.emb")) return row.querySelector("td.emb");
      let prior=row.previousElementSibling;
      while(prior){
        const cell=prior.querySelector("td.emb");
        if(cell) return cell;
        prior=prior.previousElementSibling;
      }
      return null;
    };
    const selectResult=row=>{
      resultRows.forEach(item=>{
        const active=item===row;
        item.classList.toggle("selected",active);
        item.setAttribute("aria-selected",active?"true":"false");
      });
      embodimentCells.forEach(cell=>cell.classList.toggle("selected-emb",cell===embodimentFor(row)));
    };
    resultRows.forEach(row=>{
      row.tabIndex=0;
      row.setAttribute("aria-label",`Highlight results for ${row.querySelector(".task")?.textContent.trim()||"this task"}`);
      row.setAttribute("aria-selected","false");
      row.addEventListener("click",()=>selectResult(row));
      row.addEventListener("mouseenter",()=>{
        const embodiment=embodimentFor(row);
        if(embodiment) embodiment.classList.add("hover-emb");
      });
      row.addEventListener("mouseleave",()=>embodimentCells.forEach(cell=>cell.classList.remove("hover-emb")));
      row.addEventListener("keydown",event=>{
        if(event.key==="Enter"||event.key===" "){
          event.preventDefault();
          selectResult(row);
        }
      });
    });
    // tooltips on count cells (avg cells + footer excluded)
    $$(".num:not(.avg):not(.mean-v)",tbl).forEach(td=>{
      td.addEventListener("mouseenter",e=>{
        const tr=td.closest("tr");
        // locate policy/channel from cell index among count cells of this row
        const countCells=$$("td.num:not(.avg):not(.mean-v)",tr); const idx=countCells.indexOf(td);
        const pi=Math.floor(idx/4), ci=idx%4;
        const v=td.textContent.trim();
        const tname=tr.querySelector(".task")?.textContent.trim()||"";
        showTip(e,`<div style="font-weight:600;color:#15201E">${tname}</div><div>${B.POLICY_LABEL[B.POLICIES[pi]]} · ${B.CHANNEL_LABEL[B.CHANNELS[ci]]}</div><div style="margin-top:3px">${v} / 50 successes</div>`);
      });
      td.addEventListener("mousemove",e=>moveTip(e));
      td.addEventListener("mouseleave",hideTip);
    });
    // tooltips on footer channel cells (SR%)
    $$(".mean-v",tbl).forEach(td=>{
      td.addEventListener("mouseenter",e=>{
        const tr=td.closest("tr");
        const cells=$$(".mean-v",tr); const idx=cells.indexOf(td);
        const pi=Math.floor(idx/4), ci=idx%4;
        showTip(e,`<div style="font-weight:600;color:#15201E">${B.POLICY_LABEL[B.POLICIES[pi]]} · ${B.CHANNEL_LABEL[B.CHANNELS[ci]]}</div><div style="margin-top:3px">paper-reported task-macro SR ${td.textContent.trim()}</div>`);
      });
      td.addEventListener("mousemove",e=>moveTip(e));
      td.addEventListener("mouseleave",hideTip);
    });
    // Tooltips on four-channel mean SR cells.
    $$(".avg",tbl).forEach(td=>{
      td.addEventListener("mouseenter",e=>{
        const tr=td.closest("tr"); const tid=tr.dataset.tid||"";
        const avgCells=$$(".avg",tr); const pi=avgCells.indexOf(td);
        const isFooter=tr.classList.contains("mean");
        if(isFooter){
          showTip(e,`<div style="font-weight:600;color:#15201E">${B.POLICY_LABEL[B.POLICIES[pi]]} · four-channel mean</div><div style="margin-top:3px">paper-reported task-macro SR ${td.textContent.trim()}</div>`);
        }else{
          const r=B.RESULTS[tid];
          const tname=tr.querySelector(".task")?.textContent.trim()||"";
          showTip(e,`<div style="font-weight:600;color:#15201E">${tname}</div><div>${B.POLICY_LABEL[B.POLICIES[pi]]} · four-channel mean SR</div><div style="margin-top:3px">${td.textContent.trim()} = mean of ${r[B.POLICIES[pi]].join(", ")} (out of 50)</div>`);
        }
      });
      td.addEventListener("mousemove",e=>moveTip(e));
      td.addEventListener("mouseleave",hideTip);
    });
    // LSCR is reported in the paper as a four-channel task–policy mean (not per channel).
    $$(".lscr",tbl).forEach(td=>{
      td.addEventListener("mouseenter",e=>{
        const tr=td.closest("tr"); const cells=$$(".lscr",tr); const pi=cells.indexOf(td);
        const policy=B.POLICIES[pi];
        if(tr.classList.contains("mean")){
          showTip(e,`<div style="font-weight:600;color:#15201E">${B.POLICY_LABEL[policy]} · LSCR</div><div style="margin-top:3px">all-task mean LSCR ${td.textContent.trim()}</div>`);
        }else{
          const tname=tr.querySelector(".task")?.textContent.trim()||"";
          showTip(e,`<div style="font-weight:600;color:#15201E">${tname}</div><div>${B.POLICY_LABEL[policy]} · LSCR</div><div style="margin-top:3px">four-channel mean LSCR ${td.textContent.trim()}</div>`);
        }
      });
      td.addEventListener("mousemove",e=>moveTip(e));
      td.addEventListener("mouseleave",hideTip);
    });
  })();

  /* ---------- Evaluated baselines ---------- */
  (function(){
    const lb=$("#lb-table"); if(!lb) return;
    const paperPolicyLabels={ACT:"ACT",DPC:"DP",PI05:"π₀.₅",GR00T:"GR00T"};
    let h=`<thead><tr><th class="pn">Policy</th><th>None</th><th>Equi.</th><th>Inv.</th><th>Full</th><th class="avg">SR</th><th class="lscr">LSCR</th></tr></thead><tbody>`;
    B.POLICIES.forEach(p=>{
      const summary=B.PAPER_SR_SUMMARY[p];
      h+=`<tr><td class="pn">${paperPolicyLabels[p]}</td>`
        +summary.slice(0,4).map(s=>`<td>${s.toFixed(1)}%</td>`).join("")
        +`<td class="avg">${summary[4].toFixed(1)}%</td><td class="lscr">${B.LSCR_MEAN[p].toFixed(1)}%</td></tr>`;
    });
    h+=`</tbody>`;
    lb.innerHTML=h;
  })();

  /* ---------- Resources grid ---------- */
  (function(){
    const g=$("#resource-grid");
    const icons={ docs:"📖", tools:"🛠️", results:"▦" };
    B.RESOURCE_CARDS.forEach(r=>{
      const a=el("a","resource-card");
      if(r.href){ a.href=r.href; a.target="_blank"; a.rel="noopener noreferrer"; }
      else { a.href = r.kind === "results" ? "#results" : "#docs"; }
      a.innerHTML=`<div class="ic">${icons[r.kind]||"📄"}</div>
        <h4>${r.title}</h4>
        <p>${r.body}</p>
        <div class="meta">${r.meta}</div>`;
      g.appendChild(a);
    });
  })();

  /* ---------- Copy BibTeX ---------- */
  (function(){
    const btn=$("#copy-bib"), toast=$("#copy-toast"), pre=$("#bibtex");
    btn.addEventListener("click",async()=>{
      try{ await navigator.clipboard.writeText(pre.textContent); }
      catch(e){ const ta=el("textarea"); ta.value=pre.textContent; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
      toast.classList.add("show"); setTimeout(()=>toast.classList.remove("show"),1600);
    });
  })();

  /* ---------- Placeholder-link feedback (bare '#' anchors) ---------- */
  (function(){
    const toast=$("#copy-toast");
    document.addEventListener("click",e=>{
      const a=e.target.closest('a[href="#"], a[href=""]');
      if(!a) return;
      // allow in-page anchors to real sections (#tasks etc.) — only intercept bare "#"
      e.preventDefault();
      toast.textContent = "Unavailable";
      toast.classList.add("show");
      clearTimeout(window.__soonT);
      window.__soonT=setTimeout(()=>{ toast.classList.remove("show"); toast.textContent="BibTeX copied"; },1700);
    });
  })();

  /* ---------- Fade-in on scroll ---------- */
  (function(){
    $$(".section").forEach(s=>s.classList.add("fade-in"));
    const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} }),{threshold:.08});
    $$(".fade-in").forEach(s=>io.observe(s));
  })();

})();
