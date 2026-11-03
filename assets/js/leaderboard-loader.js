/* Use the local preview registry on localhost; production shares the published registry. */
const local=["localhost","127.0.0.1","[::1]"].includes(location.hostname);
const base=local ? "http://127.0.0.1:8772/" : "https://bench2dex.github.io/Bench2Dex-Leaderboard/";
window.BenchLeaderboardBase=base;
function load(src){return new Promise((resolve,reject)=>{const script=document.createElement("script");script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error("Unable to load leaderboard resources"));document.head.appendChild(script);});}
try{
  for(const name of ["evaluations","results-model","overall-table"])await load(base+"assets/js/"+name+".js?v="+(name==="evaluations" ? Date.now() : "submissions-v1"));
}catch(error){
  console.error(error);
  const table=document.getElementById("lb-table");
  if(table)table.innerHTML='<caption>Results are temporarily unavailable.</caption>';
}
await load(new URL("./app.js?v=submissions-v1",import.meta.url).href);
