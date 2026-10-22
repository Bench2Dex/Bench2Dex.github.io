/* Shared Overall Performance table for the project home and leaderboard. */
(function(){
  "use strict";
  const B=window.BENCH,R=window.BenchResults,M=R.model,esc=R.escape;
  const columns=[
    ...B.CHANNELS.map(cid=>({id:cid,key:"sr",cid,label:B.CHANNEL_LABEL[cid],unit:"SR (%)"})),
    {id:"sr",key:"sr",cid:"mean",label:"SR",unit:"Mean (%)"},
    {id:"lscr",key:"lscr",cid:"mean",label:"LSCR",unit:"Mean (%)"},
    {id:"efficiency",key:"efficiency",cid:"mean",label:"Eff.",unit:"Ratio"}
  ];
  const policyTitle=p=>esc(p.variantLabel ? p.modelVersion : p.label)+(p.variantLabel ? `<span class="policy-variant">${esc(p.variantLabel)}</span>` : "");
  function ordered(list,state){
    return M.sorted(list,{key:state.rankMetric,direction:state.rankDir},p=>M.aggregateMetric(p.id,state.rankMetric,state.rankChannel))
      .sort((a,b)=>Number(M.aggregateEligible(b.id,state.rankMetric,state.rankChannel))-Number(M.aggregateEligible(a.id,state.rankMetric,state.rankChannel)));
  }
  function aggregateCell(p,{id,key,cid},state){
    const r=M.aggregateMetric(p.id,key,cid),active=key===state.rankMetric && cid===state.rankChannel;
    const peers=cid==="mean" ? M.peers(state.group,null,key) : [];
    let value=cid==="mean" && M.eligible(p.id,key) ? R.marked(r,peers,key) : esc(R.format(r,key,cid!=="mean"));
    const heat=cid!=="mean" && r.value!==null;
    return `<td class="${r.value===null ? "missing" : "value"}${id==="sr" ? " summary-start" : ""}${active ? " ranking-active" : ""}${heat ? " heat-cell" : ""}"${heat ? ` style="--cell-heat:${R.heat(r.value/100)}"` : ""}>${value}</td>`;
  }
  function markup(policies,state,assetPrefix=""){
    const headers='<th scope="col" class="rank-cell">Rank</th><th scope="col" class="policy-name">Model</th><th scope="col" class="type-cell">Type</th><th scope="col" class="contributor-cell">Contributor</th>'+columns.map(c=>{
      const active=c.key===state.rankMetric && c.cid===state.rankChannel;
      return `<th scope="col"${c.id==="sr" ? ' class="summary-start"' : ""} aria-sort="${active ? state.rankDir : "none"}"><button type="button" data-rank-column="${c.id}">${c.label} <span aria-hidden="true">${active ? state.rankDir==="descending" ? "↓" : "↑" : "↕"}</span><small>${c.unit}</small></button></th>`;
    }).join("");
    const rows=policies.map(p=>{
      const rank=M.aggregateRank(p.id,state.rankMetric,state.rankChannel);
      const medals=["🥇","🥈","🥉"],metal=["gold","silver","bronze"],medal=rank!==null && rank<=3;
      const rankLabel=rank===null ? "Unranked: selected metric not reported" : `Rank ${rank}${medal ? ": "+metal[rank-1]+" medal" : ""}`;
      return `<tr data-policy-row="${esc(p.id)}"><td class="rank-cell"><span class="rank-number${medal ? " rank-medal" : ""}" aria-label="${esc(rankLabel)}">${rank===null ? "—" : medal ? medals[rank-1] : rank}</span></td><th scope="row" class="policy-name"><div class="model-identity"><img class="model-logo" src="${esc(assetPrefix+p.logoPath)}" alt="${esc(p.logoAlt)}" width="26" height="26" decoding="async"><div><a class="model-name policy-label" href="${esc(p.modelUrl)}" target="_blank" rel="noopener noreferrer">${policyTitle(p)}</a></div></div></th><td class="type-cell"><span class="policy-type type-${esc(p.type.toLowerCase())}">${esc(p.type)}</span></td><td class="contributor-cell"><a href="${esc(p.contributorUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.contributor)}</a></td>${columns.map(c=>aggregateCell(p,c,state)).join("")}</tr>`;
    }).join("");
    return `<caption class="sr-only">Policy Leaderboard</caption><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody>`;
  }
  function sort(state,id){
    const column=columns.find(c=>c.id===id);if(!column)return;
    state.rankDir=state.rankMetric===column.key && state.rankChannel===column.cid && state.rankDir==="descending" ? "ascending" : "descending";
    state.rankMetric=column.key;state.rankChannel=column.cid;
  }
  const label=state=>`Ranked by ${{sr:"SR",lscr:"LSCR",efficiency:"Eff."}[state.rankMetric]}${state.rankChannel==="mean" ? "" : " · "+B.CHANNEL_LABEL[state.rankChannel]} · ${state.rankDir==="descending" ? "High to low" : "Low to high"}`;
  R.overall={columns,ordered,markup,sort,label,caption:"Channel columns report SR (%); SR and LSCR are four-channel means. NR = not reported. GPT-6-Astra reports Full SR only."};
})();
