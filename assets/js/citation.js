/* Shared citation and copy controls for the homepage and leaderboard. */
(function(){
  "use strict";
  const bibtex="@misc{yang2026bench2dex,\n  title     = {Bench2Dex: A Bimanual Manipulation Benchmark across Dexterous Hands with Simulated Fingertip Visuo-Tactile Support},\n  author    = {Yang, Zhenjie and Zhang, Yideng and Zhang, Dongjie and Jiang, Chenyu and\n               Liu, Xianshuai and Li, Yufeng and Ge, Zuhao and Jiao, Xingyu and Zhang, Zheng and\n               He, Kaiyu and Li, Qifeng and Wang, He and Zhong, Yuwen and Deng, Yi and Jiang, Muyun and\n               Huang, Xianliang and Su, Haisheng and Zhang, Donghang and Zhang, Jian and\n               Yang, Xue and Li, Hongyang and Jia, Xiaosong and Yan, Junchi},\n  journal={arXiv preprint arXiv:2609.15726},\n  year      = {2026}\n}";
  const pre=document.querySelector("#bibtex"),toast=document.querySelector("#copy-toast");
  if(pre) pre.textContent=bibtex;
  let toastTimer;
  document.querySelectorAll("[data-copy-bib]").forEach(button=>{
    const label=button.textContent;
    let buttonTimer;
    button.addEventListener("click",async()=>{
      let copied=false;
      try{await navigator.clipboard.writeText(bibtex);copied=true;}
      catch{
        const field=document.createElement("textarea");
        field.value=bibtex;
        field.style.cssText="position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
        document.body.append(field);
        field.focus();field.select();
        try{copied=document.execCommand("copy");}catch{copied=false;}
        finally{field.remove();button.focus({preventScroll:true});}
      }
      clearTimeout(buttonTimer);clearTimeout(toastTimer);
      button.textContent=copied ? "Copied!" : label;
      buttonTimer=setTimeout(()=>{button.textContent=label;},1800);
      if(toast){
        toast.textContent=copied ? "BibTeX copied" : "Copy unavailable. Select the citation below.";
        toast.classList.add("show");
        toastTimer=setTimeout(()=>toast.classList.remove("show"),copied ? 1800 : 4000);
      }
      if(!copied && pre){
        const fallback=pre.closest("details");
        if(fallback){fallback.hidden=false;fallback.open=true;}
        pre.scrollIntoView({block:"center"});pre.focus({preventScroll:true});
        const selection=window.getSelection(),range=document.createRange();
        range.selectNodeContents(pre);selection.removeAllRanges();selection.addRange(range);
      }
    });
  });
})();
