/* Offline, dependency-free manual search. Only local, bundled documentation is indexed. */
(function(){
"use strict";
const index=Array.isArray(window.HRC_SEARCH_INDEX)?window.HRC_SEARCH_INDEX:[];
const normalize=s=>String(s||"").toLocaleLowerCase("en-GB").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.+°/-]+/g," ").trim();
function rank(query){
 const q=normalize(query),tokens=q.split(/\s+/).filter(Boolean);
 if(!q)return [];
 return index.map(item=>{
   const title=normalize(item.title),group=normalize(item.group),desc=normalize(item.summary),keys=normalize(item.keywords),whole=title+" "+group+" "+desc+" "+keys;
   let score=0;
   if(title===q)score+=120;
   if(title.startsWith(q))score+=64;
   if(title.includes(q))score+=40;
   if(keys.includes(q))score+=23;
   if(desc.includes(q))score+=15;
   if(tokens.every(t=>whole.includes(t)))score+=30;
   if(tokens.some(t=>!whole.includes(t)))score-=120;
   for(const t of tokens){if(title.split(" ").includes(t))score+=16;else if(title.includes(t))score+=8;else if(keys.includes(t))score+=4;}
   if(item.group==="Tool"&&tokens.some(t=>["programme","program","manual","builder","wizard","guide"].includes(t)))score+=5;
   return {...item,score};
 }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));
}
function initialize(){
 const root=document.getElementById("siteSearch"),input=document.getElementById("siteSearchInput"),results=document.getElementById("siteSearchResults"),count=document.getElementById("siteSearchCount");
 if(!root||!input||!results||!count)return;
 const clear=document.getElementById("siteSearchClear"),focus=document.getElementById("focusSiteSearch");
 let expanded=false;
 const groupLabels={"Omron parameter":"Parameter atlas","Electrical":"Electrical reference","Programming":"Programming guide","Manual":"Operator manual","Operation":"Operation","Safety":"Safety","Maintenance":"Maintenance","Software":"Windows Studio","Tool":"Tools","Engineering":"Engineering record","Reference":"Reference"};
 function render(){
   const value=input.value.trim(),all=rank(value);
   results.replaceChildren();
   root.classList.toggle("has-search",!!value);
   if(clear)clear.hidden=!value;
   if(!value){count.textContent="";root.classList.remove("empty");return;}
   root.classList.toggle("empty",!all.length);
   count.textContent=all.length?all.length+" matching topics"+(all.length>8&&!expanded?" · first 8 shown":""):"No matching topics. Try the exact Omron code or a simpler word.";
   const shown=expanded?all:all.slice(0,8);
   const fragment=document.createDocumentFragment();
   for(const item of shown){
     const link=document.createElement("a");link.className="searchHit";link.href=item.href;
     const meta=document.createElement("span");meta.className="searchHitMeta";meta.textContent=groupLabels[item.group]||item.group;
     const heading=document.createElement("strong");heading.textContent=item.title;
     const summary=document.createElement("span");summary.className="searchHitSummary";summary.textContent=item.summary;
     link.append(meta,heading,summary);fragment.appendChild(link);
   }
   if(all.length>8){
     const more=document.createElement("button");more.type="button";more.className="searchMore";
     more.textContent=expanded?"Show fewer results":"Show all "+all.length+" results";
     more.addEventListener("click",()=>{expanded=!expanded;render()});fragment.appendChild(more);
   }
   results.appendChild(fragment);
 }
 input.addEventListener("input",()=>{expanded=false;render()});
 input.addEventListener("keydown",e=>{
   if(e.key==="Escape"){input.value="";expanded=false;render();input.blur()}
   if(e.key==="Enter"){const first=results.querySelector("a.searchHit");if(first){e.preventDefault();first.click()}}
 });
 if(clear)clear.addEventListener("click",()=>{input.value="";expanded=false;render();input.focus()});
 if(focus)focus.addEventListener("click",()=>{const active=document.querySelector(".view.active");if(active&&active.id!=="overview"){const btn=document.querySelector('.navbtn[data-v="overview"]');if(btn)btn.click()}input.focus();root.scrollIntoView({behavior:"smooth",block:"start"})});
 document.addEventListener("keydown",e=>{
   const tag=document.activeElement&&document.activeElement.tagName;
   if(e.key==="/"&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!["INPUT","TEXTAREA","SELECT"].includes(tag)){e.preventDefault();if(focus)focus.click();else input.focus()}
 });
 const params=new URLSearchParams(location.search);
 if(params.has("q"))input.value=(params.get("q")||"").slice(0,90);
 render();
 if(params.has("search")){input.focus();root.scrollIntoView({behavior:"auto",block:"start"})}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize);else initialize();
window.HRCManualSearch={rank};
})();