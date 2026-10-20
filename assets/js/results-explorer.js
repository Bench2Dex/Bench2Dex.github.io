/* One page, two independent tables: overall policy rankings and per-task scores. */
(function(){
  "use strict";
  const root=document.querySelector("#results-explorer");
  if(!root) return;
  const B=window.BENCH,R=window.BenchResults,M=R.model,esc=R.escape;
  const $=s=>root.querySelector(s);
  const labels={sr:"SR",lscr:"LSCR",efficiency:"Eff."};
  const longLabels={sr:"Stable Success Rate",lscr:"Latched Stage Completion Rate",efficiency:"Success-Conditioned Efficiency"};
  const state={};
  const group=()=>M.group(state.group),tasks=()=>M.tasks(state.group);
  const hasMetric=(p,key)=>M.metric(p.id,null,key).value!==null || tasks().some(t=>{
    const r=M.metric(p.id,t.id,key);
    return r.value!==null || (key==="efficiency" && r.status==="no-success");
  });
  const metricPolicies=key=>group().filter(p=>hasMetric(p,key));
  const channelLabel=c=>c==="mean" ? "Average" : B.CHANNEL_LABEL[c];
  const policyTitle=(p,indicator="")=>esc(p.variantLabel ? p.modelVersion : p.label)+indicator+(p.variantLabel ? `<span class="policy-variant">${esc(p.variantLabel)}</span>` : "");
  const availabilityNote=key=>" NR denotes results not reported."+(key==="sr" ? " The tactile variant reports four-channel mean SR only." : "");
  const cellValue=(r,key,cid)=>esc(R.format(r,key,cid!=="mean"));
  const announce=s=>{$("#results-status").textContent=s;};
  const enumValue=(value,options,fallback)=>options.includes(value) ? value : fallback;
  function readLocation(){
    const q=new URLSearchParams(location.search);
    state.group=enumValue(q.get("group"),M.protocols.map(p=>p.id),M.protocols[0].id);
    state.rankMetric=enumValue(q.get("rank_metric")||q.get("sort"),Object.keys(labels),"sr");
    state.rankChannel=state.rankMetric==="efficiency" ? "mean" : enumValue(q.get("rank_channel"),["mean",...B.CHANNELS],"mean");
    state.rankDir=enumValue(q.get("rank_dir"),["ascending","descending"],"descending");
    state.rankShow=enumValue(q.get("show"),["all","10","20"],"all");
    state.query=q.get("q")||"";
    state.coverage=enumValue(q.get("coverage"),["all","complete","partial"],"all");
    state.detail=enumValue(q.get("detail"),group().map(p=>p.id),null);
    state.metric=enumValue(q.get("metric"),Object.keys(labels),"sr");
    state.channel=state.metric==="efficiency" ? "mean" : enumValue(q.get("channel"),["mean",...B.CHANNELS],"mean");
    state.emb=enumValue(q.get("emb"),B.EMBODIMENTS.map(e=>e.id),"");
    state.taskSort=enumValue(q.get("task_sort"),["paper",...group().map(p=>p.id)],"paper");
    state.taskDir=enumValue(q.get("task_dir"),["ascending","descending"],"descending");
    state.policyShow=enumValue(q.get("policy_show"),["all","custom"],"all");
    state.policies=[...new Set((q.get("policies")||"").split(","))].filter(id=>group().some(p=>p.id===id));
    state.taskDetail=enumValue(q.get("task_detail")||q.get("task"),tasks().map(t=>t.id),null);
    state.collapsed=(q.get("collapsed")||"").split(",").filter(id=>B.EMBODIMENTS.some(e=>e.id===id));
    $("#results-group").innerHTML=M.protocols.map(p=>`<option value="${esc(p.id)}">${esc(p.label)}</option>`).join("");
    $("#results-group-control").hidden=M.protocols.length<2;
    $("#task-embodiment").innerHTML='<option value="">All Embodiments</option>'+B.EMBODIMENTS.filter(e=>tasks().some(t=>t.emb===e.id)).map(e=>`<option value="${esc(e.id)}">${esc(e.name)}</option>`).join("");
    syncControls();
  }
  function syncControls(){
    const policies=metricPolicies(state.rankMetric),taskPolicies=metricPolicies(state.metric);
    if(state.detail && !policies.some(p=>p.id===state.detail)) state.detail=null;
    if(state.taskSort!=="paper" && !taskPolicies.some(p=>p.id===state.taskSort)) state.taskSort="paper";
    if(state.policyShow==="custom" && state.policies.length && !taskPolicies.some(p=>state.policies.includes(p.id))) state.policyShow="all";
    for(const [id,key] of [["results-group","group"],["board-limit","rankShow"],["board-coverage","coverage"],["board-search","query"],["task-channel","channel"],["task-embodiment","emb"]]) $("#"+id).value=state[key];
    $("#board-limit").closest("label").hidden=policies.length<=10 && state.rankShow==="all";
    $("#board-search").closest("label").hidden=policies.length<=6 && !state.query;
    $("#board-coverage").closest("label").hidden=policies.every(p=>M.aggregateEligible(p.id,state.rankMetric,state.rankChannel)) && state.coverage==="all";
    $("#task-channel").closest("label").hidden=state.metric==="efficiency";
    root.querySelectorAll('[data-rank]').forEach(b=>b.setAttribute("aria-pressed",b.dataset.rank===state.rankMetric));
    root.querySelectorAll('[data-task-metric]').forEach(b=>b.setAttribute("aria-pressed",b.dataset.taskMetric===state.metric));
  }
  function saveLocation(){
    const q=new URLSearchParams({group:state.group,rank_metric:state.rankMetric,rank_channel:state.rankChannel,rank_dir:state.rankDir,metric:state.metric,channel:state.channel});
    for(const [key,value] of [["show",state.rankShow!=="all" ? state.rankShow : ""],["q",state.query],["coverage",state.coverage!=="all" ? state.coverage : ""],["detail",state.detail],["emb",state.emb],["task_sort",state.taskSort!=="paper" ? state.taskSort : ""],["task_dir",state.taskSort!=="paper" ? state.taskDir : ""],["policy_show",state.policyShow!=="all" ? state.policyShow : ""],["policies",state.policies.join(",")],["task_detail",state.taskDetail],["collapsed",state.collapsed.join(",")]]) if(value) q.set(key,value);
    history.replaceState(null,"",location.pathname+"?"+q+location.hash);
  }
  function orderedPolicies(list,key,cid,direction="descending"){
    const ordered=M.sorted(list,{key,direction},p=>M.aggregateMetric(p.id,key,cid));
    return ordered.sort((a,b)=>Number(M.aggregateEligible(b.id,key,cid))-Number(M.aggregateEligible(a.id,key,cid)));
  }
  function rankingPolicies(){
    const list=metricPolicies(state.rankMetric).filter(p=>(!state.query || `${p.label} ${p.modelVersion||""}`.toLowerCase().includes(state.query.toLowerCase())) && (state.coverage==="all" || M.aggregateEligible(p.id,state.rankMetric,state.rankChannel)===(state.coverage==="complete")));
    const ordered=orderedPolicies(list,state.rankMetric,state.rankChannel,state.rankDir);
    return {all:ordered,visible:state.rankShow==="all" ? ordered : ordered.filter(p=>{const rank=M.aggregateRank(p.id,state.rankMetric,state.rankChannel);return rank!==null && rank<=Number(state.rankShow);})};
  }
  function matrixPolicies(){
    const ordered=metricPolicies(state.metric).sort((a,b)=>a.displayOrder-b.displayOrder);
    return state.policyShow==="custom" ? ordered.filter(p=>state.policies.includes(p.id)) : ordered;
  }
  function matrixTasks(){
    const list=tasks().filter(t=>!state.emb || t.emb===state.emb);
    return state.taskSort==="paper" ? list : M.sorted(list,{key:state.metric,direction:state.taskDir},t=>M.metric(state.taskSort,t.id,state.metric,state.channel));
  }
  function table(id,label,headers,rows,cls=""){
    return `<div class="explorer-table-wrap" role="region" aria-label="${label}" tabindex="0"><table id="${id}" class="policy-table ${cls}"><caption class="sr-only">${label}</caption><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  const empty=message=>`<p class="results-empty">${message}</p>`;
  const safeLink=value=>{try{const u=new URL(value);return ["http:","https:"].includes(u.protocol) ? esc(u.href) : "";}catch{return "";}};
  function aggregateCell(p,cid){
    const key=state.rankMetric,r=M.aggregateMetric(p.id,key,cid),active=cid===state.rankChannel;
    const peers=cid==="mean" ? M.peers(state.group,null,key) : [];
    let value=cid==="mean" && M.eligible(p.id,key) ? R.marked(r,peers,key) : cellValue(r,key,cid);
    if(key==="efficiency" && Number.isFinite(M.summary(p.id).efficiencyTaskCount)) value+=`<small>${M.summary(p.id).efficiencyTaskCount} successful tasks</small>`;
    if(cid==="mean" && key!=="efficiency" && r.value!==null) value+=`<span class="score-track" aria-hidden="true"><span style="width:${Math.min(100,Math.max(0,r.value))}%"></span></span>`;
    const heat=cid!=="mean" && r.value!==null;
    return `<td class="${r.value===null ? "missing" : "value"}${active ? " ranking-active" : ""}${heat ? " heat-cell" : ""}"${heat ? ` style="--cell-heat:${R.heat(r.value/100)}"` : ""}>${value}</td>`;
  }
  function policyDetails(p,colspan){
    const s=M.summary(p.id),source=safeLink(p.sourceUrl);
    const values=[["Training",p.trainingSetting||"NR"],["Results",p.resultVersion],["Source",!source ? p.sourceLabel : null],["Checkpoint",p.checkpoint],["Updated",p.updatedAt]].filter(([,v])=>v);
    return `<tr class="policy-detail-row" id="policy-detail-${esc(p.id)}"><td colspan="${colspan}"><div class="policy-detail"><h3>${esc(p.label)} <span>Evaluation Details</span></h3><dl>${values.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl><div class="detail-metrics">${Object.keys(labels).map(k=>`<span>${labels[k]} <b>${R.format(M.metric(p.id,null,k),k)}</b></span>`).join("")}<span>Efficiency: ${Number.isFinite(s.efficiencyTaskCount) ? s.efficiencyTaskCount+" successful tasks" : "NR"}</span></div><div class="detail-actions"><button type="button" data-focus-policy="${esc(p.id)}">Locate in Per-Task Scores ↓</button><button type="button" data-policy-csv="${esc(p.id)}">Policy CSV ↓</button>${source ? `<a href="${source}" target="_blank" rel="noopener noreferrer">${esc(p.sourceLabel||"Source")} ↗</a>` : ""}</div></div></td></tr>`;
  }
  function renderRanking(){
    const {all,visible}=rankingPolicies(),channels=state.rankMetric==="efficiency" ? ["mean"] : ["mean",...B.CHANNELS],colspan=channels.length+4;
    const headers='<th scope="col" class="rank-cell">Rank</th><th scope="col" class="policy-name">Policy</th>'+channels.map(c=>`<th scope="col" aria-sort="${c===state.rankChannel ? state.rankDir : "none"}"><button type="button" data-rank-channel="${c}">${channelLabel(c)} <span aria-hidden="true">${c===state.rankChannel ? state.rankDir==="descending" ? "↓" : "↑" : "↕"}</span><small>${labels[state.rankMetric]}${state.rankMetric==="efficiency" ? "" : " (%)"}</small></button></th>`).join("")+'<th scope="col">Coverage</th><th scope="col"><span class="sr-only">Details</span></th>';
    const rows=visible.map(p=>{
      const rank=M.aggregateRank(p.id,state.rankMetric,state.rankChannel),open=state.detail===p.id;
      return `<tr data-policy-row="${esc(p.id)}" class="${open ? "is-selected" : ""}"><td class="rank-cell"><span class="rank-number${rank!==null && rank<=3 ? " rank-top" : ""}">${rank===null ? "—" : rank}</span></td><th scope="row" class="policy-name"><button type="button" data-policy-open="${esc(p.id)}" aria-expanded="${open}"><span class="policy-label">${policyTitle(p)}</span></button></th>${channels.map(c=>aggregateCell(p,c)).join("")}<td class="coverage-cell">${M.aggregateCoverage(p.id,state.rankMetric,state.rankChannel)}/${tasks().length}</td><td class="expand-cell"><button type="button" data-policy-open="${esc(p.id)}" aria-expanded="${open}" aria-label="Evaluation details for ${esc(p.label)}">${open ? "−" : "+"}</button></td></tr>`+(open ? policyDetails(p,colspan) : "");
    }).join("");
    $("#overview-table").innerHTML=visible.length ? table("overview-results","Policy Leaderboard",headers,rows,"ranking-table"+(state.rankMetric==="efficiency" ? " efficiency-ranking" : "")) : empty("No policies match these filters.");
    $("#ranking-label").textContent=`${longLabels[state.rankMetric]} · Ranked by ${channelLabel(state.rankChannel)} · ${state.rankDir==="descending" ? "High to low" : "Low to high"}`;
    const total=metricPolicies(state.rankMetric).length;
    $("#ranking-count").textContent=`${visible.length} ${visible.length===1 ? "policy" : "policies"}${all.length!==total || visible.length!==all.length ? " shown · "+total+" total" : ""}${state.rankShow!=="all" ? " · Top ranks include ties" : ""}`;
    const tactileNote=state.rankMetric==="sr" ? " GR00T with vs. without tactile input: mean SR 25.5% vs. 24.9%; 14 tasks improve, 10 decline, and 2 tie. Both variants use matched episode seeds, execution budgets, and stable-success dwell time; gains depend on the task." : "";
    $("#ranking-caption").textContent=(state.rankMetric==="efficiency" ? "Expert-normalized efficiency pools successful episodes across all four channels. Higher is better; — means no successful rollout. Read alongside SR." : `${labels[state.rankMetric]} (%) · Average weights every task and channel equally. Darker cells and longer bars indicate higher values (0–100%).`)+availabilityNote(state.rankMetric)+tactileNote+(metricPolicies(state.rankMetric).some(p=>!M.aggregateEligible(p.id,state.rankMetric,state.rankChannel)) ? " — ranks indicate incomplete comparable results." : "");
    $("#results-export-ranking").disabled=!visible.length;
  }
  function metricCell(p,t,key,cid="mean",peers=null){
    const r=M.metric(p.id,t.id,key,cid);
    const scale=key==="successes" ? M.channel(p.id,t.id,cid)?.episodes : 100;
    const heat=r.value!==null && key!=="efficiency" && Number.isFinite(scale) && scale>0;
    const canBest=cid==="mean" && M.comparable(p.id,t.id,key);
    const value=canBest ? R.marked(r,peers||M.peers(state.group,t.id,key),key) : cellValue(r,key,cid);
    return `<td class="${r.value===null ? "missing" : "value"}${heat ? " heat-cell" : ""}"${heat ? ` style="--cell-heat:${R.heat(r.value/scale)}"` : ""}>${value}</td>`;
  }
  function taskDetails(t,policies){
    const key=state.metric,channels=key==="efficiency" ? ["mean"] : [...B.CHANNELS,"mean"];
    const heading=c=>c==="mean" ? key==="efficiency" ? "Eff." : "Mean" : B.CHANNEL_LABEL[c];
    const headers='<th scope="col" class="policy-name">Policy</th>'+channels.map(c=>`<th scope="col"${c===state.channel ? ' class="detail-channel-active"' : ""}>${heading(c)}</th>`).join("");
    const rows=policies.map(p=>`<tr><th scope="row" class="policy-name">${policyTitle(p)}</th>${channels.map(c=>metricCell(p,t,key,c)).join("")}</tr>`).join("");
    const caption=(key==="efficiency" ? "Expert-normalized efficiency, pooled across successful episodes in all four channels. — means no successful rollout." : `${labels[key]} (%) · Four channels and their reported mean. Darker blue means a higher value; only the best Mean is outlined.`)+availabilityNote(key);
    return `<tr class="task-detail-row" id="task-detail-${esc(t.id)}"><td colspan="${policies.length+1}"><div class="task-detail"><h3>${esc(t.name)} <span>${longLabels[key]}</span></h3>${table("task-metric-results",longLabels[key],headers,rows,"task-metric-table")}<p class="results-caption">${caption}</p></div></td></tr>`;
  }
  function renderPicker(){
    const policies=metricPolicies(state.metric);
    $(".policy-picker").hidden=policies.length<=6 && state.policyShow!=="custom";
    const query=$("#policy-search").value.toLowerCase();
    $("#policy-options").innerHTML=policies.filter(p=>p.label.toLowerCase().includes(query)).map(p=>`<label><input type="checkbox" data-pick="${esc(p.id)}" ${state.policyShow==="all" || state.policies.includes(p.id) ? "checked" : ""}><span><b>${esc(p.label)}</b></span></label>`).join("") || '<p>No matching policies.</p>';
    $("#policy-choice-count").textContent=state.policyShow==="custom" ? `${matrixPolicies().length} Selected Policies` : "Policies (All)";
  }
  function renderMatrix(){
    const policies=matrixPolicies(),list=matrixTasks(),grouped=state.taskSort==="paper";
    const headers='<th scope="col" class="task-name">Task / Embodiment</th>'+policies.map(p=>`<th scope="col" aria-sort="${state.taskSort===p.id ? state.taskDir : "none"}"><button type="button" data-task-sort="${esc(p.id)}">${policyTitle(p,` <span aria-hidden="true">${state.taskSort===p.id ? state.taskDir==="descending" ? "↓" : "↑" : "↕"}</span>`)}</button></th>`).join("");
    let prevEmb=null;
    const rows=list.map(t=>{
      const e=B.EMBODIMENTS.find(e=>e.id===t.emb),start=grouped && t.emb!==prevEmb;prevEmb=t.emb;
      const collapsed=grouped && state.collapsed.includes(t.emb),open=state.taskDetail===t.id;
      const count=list.filter(t=>t.emb===e.id).length;
      const heading=start ? `<tr class="emb-group"><th colspan="${policies.length+1}"><button type="button" data-emb="${esc(t.emb)}" aria-expanded="${!collapsed}">${collapsed ? "+" : "−"} ${esc(e.name)} <span>${count} ${count===1 ? "task" : "tasks"}</span></button></th></tr>` : "";
      const peers=state.channel==="mean" ? M.peers(state.group,t.id,state.metric) : [];
      return heading+`<tr data-task-row="${esc(t.id)}" ${collapsed ? "hidden" : ""} class="${open ? "is-selected" : ""}"><th scope="row" class="task-name"><button type="button" data-task-open="${esc(t.id)}" aria-expanded="${open}"><span class="task-toggle" aria-hidden="true">${open ? "−" : "+"}</span><span><span class="policy-label">${esc(t.name)}</span>${grouped ? "" : `<span class="policy-meta">${esc(e.name)}</span>`}</span></button></th>${policies.map(p=>metricCell(p,t,state.metric,state.channel,peers)).join("")}</tr>`+(open && !collapsed ? taskDetails(t,policies) : "");
    }).join("");
    $("#task-matrix").innerHTML=!policies.length ? empty("No policies selected. Use Policies to select models or show all.") : !list.length ? empty("No matching tasks. Adjust the task filters.") : table("per-task-results","Per-Task Scores",headers,rows,"task-matrix-table");
    $("#task-scope").textContent=`${longLabels[state.metric]} · ${state.channel==="mean" ? state.metric==="efficiency" ? "Pooled Successful Episodes" : "Four-Channel Mean" : B.CHANNEL_LABEL[state.channel]}`;
    $("#task-count").textContent=`${list.length} of ${tasks().length} tasks · ${policies.length} of ${metricPolicies(state.metric).length} policies`;
    $("#task-heat-key").hidden=state.metric==="efficiency";
    $("#emb-expand-all").hidden=!grouped || !state.collapsed.length;
    $("#task-caption").textContent=`${state.metric==="efficiency" ? "Efficiency pools successful episodes across all channels." : labels[state.metric]+" (%) · Fixed 0–100% color scale."} Outlined means are best across all eligible policies.${availabilityNote(state.metric)} Scroll within the table; headers and task names stay fixed.`;
    $("#results-export-tasks").disabled=!policies.length || !list.length;
    renderPicker();
  }
  function render(resetTable="",anchorSelector=null){
    // Keep the reader's position when metrics or inline details update.
    const positions=new Map([...root.querySelectorAll('.explorer-table-wrap > table[id]')].map(t=>[t.id,{top:t.parentElement.scrollTop,left:t.parentElement.scrollLeft}]));
    const anchor=anchorSelector ? $(anchorSelector) : null;
    const anchorTop=anchor ? anchor.getBoundingClientRect().top-anchor.closest("table").parentElement.getBoundingClientRect().top : null;
    syncControls();renderRanking();renderMatrix();saveLocation();
    for(const [id,pos] of positions){
      const wrap=$("#"+id)?.parentElement;
      if(wrap){wrap.scrollTop=id===resetTable ? 0 : pos.top;wrap.scrollLeft=pos.left;}
    }
    const next=anchorSelector ? $(anchorSelector) : null;
    if(next && anchorTop!==null){
      const wrap=next.closest("table").parentElement;
      wrap.scrollTop+=next.getBoundingClientRect().top-wrap.getBoundingClientRect().top-anchorTop;
    }
    $("#results-protocol-note").textContent=M.protocols.find(g=>g.id===state.group).description;
    document.querySelector("#board-release").textContent=`${group().length} policies · Reported Evaluations`;
  }
  function resetTable(id,message){
    render(id);
    const wrap=$("#"+id)?.parentElement;
    if(wrap){wrap.scrollTop=0;wrap.scrollLeft=0;}
    announce(message);
  }
  function focusButton(attribute,value){[...root.querySelectorAll(`[${attribute}]`)].find(e=>e.getAttribute(attribute)===value)?.focus({preventScroll:true});}
  root.addEventListener("click",event=>{
    const button=event.target.closest("button");if(!button) return;
    const d=button.dataset;
    if(d.rank){state.rankMetric=d.rank;if(d.rank==="efficiency") state.rankChannel="mean";state.rankDir="descending";render("overview-results");return;}
    if(d.rankChannel){state.rankDir=state.rankChannel===d.rankChannel && state.rankDir==="descending" ? "ascending" : "descending";state.rankChannel=d.rankChannel;render("overview-results");focusButton("data-rank-channel",d.rankChannel);return;}
    if(d.taskMetric){state.metric=d.taskMetric;if(d.taskMetric==="efficiency") state.channel="mean";render();return;}
    if(d.policyOpen){state.detail=state.detail===d.policyOpen ? null : d.policyOpen;render("",`[data-policy-row="${CSS.escape(d.policyOpen)}"]`);focusButton("data-policy-open",d.policyOpen);return;}
    if(d.taskSort){if(state.taskSort!==d.taskSort){state.taskSort=d.taskSort;state.taskDir="descending";}else if(state.taskDir==="descending"){state.taskDir="ascending";}else{state.taskSort="paper";state.taskDir="descending";}render("per-task-results");focusButton("data-task-sort",d.taskSort);return;}
    if(d.taskOpen){state.taskDetail=state.taskDetail===d.taskOpen ? null : d.taskOpen;render("",`[data-task-row="${CSS.escape(d.taskOpen)}"]`);focusButton("data-task-open",d.taskOpen);return;}
    if(d.emb){state.collapsed=state.collapsed.includes(d.emb) ? state.collapsed.filter(id=>id!==d.emb) : [...state.collapsed,d.emb];render();focusButton("data-emb",d.emb);return;}
    if(d.policyCsv){download(M.csv({policyIds:[d.policyCsv]}),"policy-"+d.policyCsv);return;}
    if(d.focusPolicy){if(!hasMetric(group().find(p=>p.id===d.focusPolicy),state.metric)){state.metric=state.rankMetric;state.channel="mean";}state.policyShow="custom";state.policies=[d.focusPolicy];state.emb="";state.collapsed=[];render();location.hash="per-task-scores";$("#policy-choice-count").focus({preventScroll:true});return;}
  });
  root.addEventListener("change",event=>{
    const id=event.target.dataset.pick;if(!id) return;
    if(state.policyShow==="all") state.policies=group().map(p=>p.id);
    state.policies=event.target.checked ? [...new Set([...state.policies,id])] : state.policies.filter(p=>p!==id);state.policyShow="custom";render();focusButton("data-pick",id);
  });
  root.addEventListener("keydown",event=>{if(event.key==="Escape")root.querySelectorAll('.policy-picker[open]').forEach(d=>{d.open=false;d.querySelector("summary").focus();});});
  for(const [id,key] of [["board-limit","rankShow"],["board-coverage","coverage"],["task-channel","channel"],["task-embodiment","emb"]]) $("#"+id).addEventListener("change",e=>{state[key]=e.target.value;render(id==="task-channel" ? "" : id==="task-embodiment" ? "per-task-results" : "overview-results");});
  for(const [id,key] of [["board-search","query"]]) $("#"+id).addEventListener("input",e=>{state[key]=e.target.value;render(id==="task-channel" ? "" : id==="task-embodiment" ? "per-task-results" : "overview-results");});
  $("#policy-search").addEventListener("input",renderPicker);
  $("#policies-all").addEventListener("click",()=>{state.policies=[];state.policyShow="all";$(".policy-picker").open=false;render();});
  $("#policies-none").addEventListener("click",()=>{state.policies=[];state.policyShow="custom";render();});
  $("#emb-expand-all").addEventListener("click",()=>{state.collapsed=[];render();});
  $("#ranking-reset").addEventListener("click",()=>{
    Object.assign(state,{rankMetric:"sr",rankChannel:"mean",rankDir:"descending",rankShow:"all",query:"",coverage:"all",detail:null});
    resetTable("overview-results","Overall Performance reset to defaults.");
  });
  $("#task-reset").addEventListener("click",()=>{
    Object.assign(state,{metric:"sr",channel:"mean",emb:"",taskSort:"paper",taskDir:"descending",policyShow:"all",policies:[],taskDetail:null,collapsed:[]});
    $("#policy-search").value="";
    $(".policy-picker").open=false;
    resetTable("per-task-results","Per-Task Scores reset to defaults.");
  });
  $("#results-group").addEventListener("change",e=>{history.replaceState(null,"",location.pathname+"?group="+encodeURIComponent(e.target.value));readLocation();render();});
  function download(csv,name){
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");a.href=url;a.download=`bench2dex-${name}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce("CSV exported.");
  }
  $("#results-export-all").addEventListener("click",()=>download(M.csv(),"all-policies"));
  $("#results-export-ranking").addEventListener("click",()=>download(M.csv({policyIds:rankingPolicies().visible.map(p=>p.id),summaryOnly:true}),"leaderboard"));
  $("#results-export-tasks").addEventListener("click",()=>download(M.csv({policyIds:matrixPolicies().map(p=>p.id),taskIds:matrixTasks().map(t=>t.id),metricKey:state.metric,channelId:state.channel}),"per-task"));
  $("#results-share").addEventListener("click",async()=>{saveLocation();try{await navigator.clipboard.writeText(location.href);announce("View link copied.");}catch{$("#share-fallback").hidden=false;$("#share-url").value=location.href;$("#share-url").focus();$("#share-url").select();}});
  window.addEventListener("popstate",()=>{readLocation();render();});
  function revealSection(){const e=document.getElementById(location.hash.slice(1));if(e?.matches("details"))e.open=true;}
  document.querySelectorAll('.board-jumps a').forEach(a=>a.addEventListener("click",()=>{const e=document.getElementById(a.hash.slice(1));if(e?.matches("details"))e.open=true;}));
  window.addEventListener("hashchange",revealSection);
  readLocation();render();revealSection();
})();
