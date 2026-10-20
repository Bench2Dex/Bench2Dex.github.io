/* Published paper baselines; independent of additional leaderboard policies. */
(function(){
  "use strict";
  const B=window.BENCH,R=window.BenchResults;
  const $=(s,p=document)=>p.querySelector(s);
  const $$=(s,p=document)=>Array.from(p.querySelectorAll(s));
  const el=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;e.textContent=text;return e;};
  const heatColor=R.heat,heatText="#15201E";
  const bestHtml=(value,peers,label)=>value!==null && value===Math.max(...peers.filter(v=>v!==null)) ? `<strong class="best-value">${label}</strong>` : label;
  /* Shared row interaction for both result tables; heatmap colors stay intact. */
  function bindResultSelection(tbl){
    const rows=$$("tbody tr.result-row",tbl);
    const embodiments=$$("tbody td.emb",tbl);
    const owners=new Map();
    let owner=null;
    rows.forEach(row=>{
      owner=row.querySelector(".emb")||owner;
      owners.set(row,owner);
    });
    const select=row=>{
      rows.forEach(item=>{
        const active=item===row;
        item.classList.toggle("selected",active);
        item.querySelector(".row-select").setAttribute("aria-pressed",String(active));
      });
      embodiments.forEach(cell=>cell.classList.toggle("selected-emb",cell===owners.get(row)));
    };
    rows.forEach(row=>{
      const task=row.querySelector(".task");
      const button=el("button","row-select",task.textContent);
      button.type="button";
      button.setAttribute("aria-label",`Highlight results for ${task.textContent.trim()}`);
      button.setAttribute("aria-pressed","false");
      task.replaceChildren(button);
      row.addEventListener("click",event=>{
        // A merged embodiment cell labels a group, not its first task.
        if(event.target.closest(".emb")) return;
        select(row.classList.contains("selected")?null:row);
      });
      row.addEventListener("mouseenter",()=>owners.get(row)?.classList.add("hover-emb"));
      row.addEventListener("mouseleave",()=>embodiments.forEach(cell=>cell.classList.remove("hover-emb")));
    });
    tbl.closest(".table-wrap").addEventListener("keydown",event=>{
      if(event.key==="Escape") select(null);
    });
  }

  /* ---------- Results: full comparison table (replaces heatmap) ---------- */
  (function(){
    const tbl=$("#results-table");
    if(!tbl) return;
    function cell(v){
      const frac=v/B.ROLLOUTS_PER_CELL;
      return `<td class="num" style="background:${heatColor(frac)};color:${heatText}">${v}</td>`;
    }
    function avgPct(counts){ // counts: [none,equi,inv,full]
      const m=(counts[0]+counts[1]+counts[2]+counts[3])/4;
      return m/B.ROLLOUTS_PER_CELL*100;
    }
    function avgCell(counts, taskId){
      const v=avgPct(counts);
      const all=B.POLICIES.map(p=>avgPct(B.RESULTS[taskId][p]));
      return `<td class="avg">${bestHtml(v,all,`${v.toFixed(1)}%`)}</td>`;
    }
    function lscrCell(policy, taskId){
      const value=B.LSCR[taskId][policy];
      const all=B.POLICIES.map(p=>B.LSCR[taskId][p]);
      return `<td class="lscr">${bestHtml(value,all,`${value.toFixed(1)}%`)}</td>`;
    }
    function effCell(policy, taskId){
      const value=B.EFFICIENCY[taskId][policy];
      if(value===null) return `<td class="eff unreported">—</td>`;
      const all=B.POLICIES.map(p=>B.EFFICIENCY[taskId][p]);
      return `<td class="eff">${bestHtml(value,all,value.toFixed(3))}</td>`;
    }
    // header
    const chs=B.CHANNELS;
    let head=`<thead><tr>
      <th rowspan="2" class="th-task">Task</th>
      <th rowspan="2" class="th-emb">Embodiment</th>
      ${B.POLICIES.map(p=>`<th colspan="7" class="th-pol">${B.POLICY_LABEL[p]}</th>`).join("")}
    </tr><tr>
      ${B.POLICIES.map(()=>chs.map(c=>`<th class="th-ch">${B.CHANNEL_LABEL[c]}</th>`).join("")+`<th class="th-ch th-avg">SR</th><th class="th-ch th-lscr">LSCR</th><th class="th-ch th-eff">Eff.</th>`).join("")}
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
          ${B.POLICIES.map(p=>chs.map((c,ci)=>cell(r[p][ci])).join("")+avgCell(r[p],tid)+lscrCell(p,tid)+effCell(p,tid)).join("")}
        </tr>`;
      });
    });
    // Footer: exact paper-reported task-macro SR, LSCR, and efficiency.
    body += `<tr class="mean">
      <td colspan="2" class="mean-label">Task Mean</td>
      ${B.POLICIES.map(p=>{
        const summary=B.PAPER_SR_SUMMARY[p];
        const srs=summary.slice(0,4);
        const avg=summary[4];
        const lscr=B.LSCR_MEAN[p];
        const eff=B.EFFICIENCY_MEAN[p];
        return srs.map(s=>`<td class="num mean-v">${s.toFixed(1)}%</td>`).join("")
          +`<td class="avg mean-avg">${bestHtml(avg,B.POLICIES.map(q=>B.PAPER_SR_SUMMARY[q][4]),`${avg.toFixed(1)}%`)}</td>`
          +`<td class="lscr mean-lscr">${bestHtml(lscr,B.POLICIES.map(q=>B.LSCR_MEAN[q]),`${lscr.toFixed(1)}%`)}</td>`
          +`<td class="eff mean-eff">${bestHtml(eff,B.POLICIES.map(q=>B.EFFICIENCY_MEAN[q]),eff.toFixed(3))}</td>`;
      }).join("")}
    </tr>`;
    body+="</tbody>";
    tbl.innerHTML=head+body;
    bindResultSelection(tbl);
  })();

  /* ---------- Per-channel latched stage completion ---------- */
  (function(){
    const tbl=$("#lscr-table"); if(!tbl) return;
    const taskById=id=>B.TASKS.find(t=>t.id===id);
    const channelMean=(policy,ci)=>B.LSCR_CHANNEL_MEAN[policy][ci];
    const channelCell=(fraction,label,footer=false)=>fraction===null ? '<td class="unreported">Pending</td>' : `<td class="lscr-channel${footer?" mean-v":""}" style="--lscr-heat:${heatColor(fraction)};--lscr-heat-text:${heatText}">${label}</td>`;
    const header=`<thead><tr><th rowspan="2" class="th-task">Task</th><th rowspan="2" class="th-emb">Embodiment</th>${B.POLICIES.map(p=>`<th colspan="5" class="th-pol">${B.POLICY_LABEL[p]}</th>`).join("")}</tr><tr>${B.POLICIES.map(()=>B.CHANNELS.map(c=>`<th class="th-ch">${B.CHANNEL_LABEL[c]}</th>`).join("")+`<th class="th-ch th-lscr">Mean</th>`).join("")}</tr></thead>`;
    let body="<tbody>";
    B.EMBODIMENTS.forEach((emb,gi)=>{
      emb.tasks.forEach((tid,ri)=>{
        const embCell=ri===0 ? `<td class="emb" rowspan="${emb.tasks.length}">${emb.name}</td>` : "";
        const values=B.POLICIES.map(p=>{
          const channels=B.LSCR_CHANNELS[tid][p].map(v=>channelCell(v,v===null ? "Pending" : `${(v*100).toFixed(2)}%`)).join("");
          const mean=B.LSCR[tid][p];
          return channels+`<td class="lscr">${bestHtml(mean,B.POLICIES.map(q=>B.LSCR[tid][q]),`${mean.toFixed(1)}%`)}</td>`;
        }).join("");
        body+=`<tr data-tid="${tid}" class="result-row ${ri===0&&gi>0?"grp":""}"><td class="task">${taskById(tid).name}</td>${embCell}${values}</tr>`;
      });
    });
    body+=`<tr class="mean"><td colspan="2" class="mean-label">Task Mean (%)</td>${B.POLICIES.map(p=>B.CHANNELS.map((_,ci)=>{
      const mean=channelMean(p,ci);
      return channelCell(mean===null ? null : mean/100,mean===null ? "Pending" : `${mean.toFixed(1)}%`,true);
    }).join("")+`<td class="lscr mean-lscr">${bestHtml(B.LSCR_MEAN[p],B.POLICIES.map(q=>B.LSCR_MEAN[q]),`${B.LSCR_MEAN[p].toFixed(1)}%`)}</td>`).join("")}</tr>`;
    tbl.innerHTML=header+body+"</tbody>";
    bindResultSelection(tbl);
  })();

})();
