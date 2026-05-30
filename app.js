const data = window.SPECIALS_DATA || [];
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const fields = {name:'Special Name',category:'Category',week:'Week',date:'Date Range',meal:'Meal Type',protein:'Protein',primary:'Primary Protein',secondary:'Secondary Protein',ingredients:'Ingredients',sauce:'Sauce',station:'Station',difficulty:'Prep Difficulty',speed:'Pickup Speed',repeat:'Repeat Candidate',notes:'Notes',score:'Score'};
let current = [...data];
function val(o,k){return (o[k] ?? '').toString().trim();}
function uniq(arr){return [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b));}
function countBy(key){const m={}; data.forEach(x=>{const v=val(x,key); if(v)m[v]=(m[v]||0)+1}); return Object.entries(m).sort((a,b)=>b[1]-a[1]);}
function init(){
  $('#totalSpecials').textContent=data.length;
  $('#totalWeeks').textContent=uniq(data.map(x=>val(x,fields.week))).length;
  $('#repeatCount').textContent=data.filter(x=>/yes|high|true/i.test(val(x,fields.repeat))).length;
  fillSelect('#categoryFilter', uniq(data.map(x=>val(x,fields.category))));
  fillSelect('#mealFilter', uniq(data.map(x=>val(x,fields.meal))));
  fillSelect('#stationFilter', uniq(data.map(x=>val(x,fields.station))));
  fillSelect('#speedFilter', uniq(data.map(x=>val(x,fields.speed))));
  renderDashboard(); renderBrowse(); renderWeeks();
  $$('.tab').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  ['#searchInput','#categoryFilter','#mealFilter','#stationFilter','#speedFilter'].forEach(s=>$(s).addEventListener('input',applyFilters));
  $('#closeDialog').addEventListener('click',()=>$('#detailDialog').close());
  $('#suggestBalanced').addEventListener('click',suggestBalanced);
  setupInstall();
}
function fillSelect(sel, items){const el=$(sel); items.forEach(i=>{const o=document.createElement('option');o.value=i;o.textContent=i;el.appendChild(o);});}
function showView(id){$$('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===id));$$('.view').forEach(v=>v.classList.toggle('active',v.id===id));}
function renderDashboard(){
  const cats=countBy(fields.category);
  $('#categoryChips').innerHTML=cats.map(([c,n])=>`<button class="chip" data-cat="${esc(c)}">${esc(c)}<span>${n} specials</span></button>`).join('');
  $$('#categoryChips .chip').forEach(b=>b.onclick=()=>{showView('browse');$('#categoryFilter').value=b.dataset.cat;applyFilters();});
  $('#categoryStats').innerHTML=cats.slice(0,8).map(([k,n])=>`<div class="statRow"><b>${esc(k)}</b><span>${n}</span></div>`).join('');
  $('#proteinStats').innerHTML=countBy(fields.primary).slice(0,8).map(([k,n])=>`<div class="statRow"><b>${esc(k)}</b><span>${n}</span></div>`).join('');
  const repeats=data.filter(x=>/yes|high|true/i.test(val(x,fields.repeat))).slice(0,8);
  $('#repeatCards').innerHTML=repeats.map(cardHTML).join(''); attachCardClicks('#repeatCards');
}
function applyFilters(){
 const q=val($('#searchInput'),'value').toLowerCase(); const cat=$('#categoryFilter').value, meal=$('#mealFilter').value, station=$('#stationFilter').value, speed=$('#speedFilter').value;
 current=data.filter(x=>{
   const hay=[fields.name,fields.category,fields.meal,fields.protein,fields.primary,fields.secondary,fields.ingredients,fields.sauce,fields.station,fields.notes].map(k=>val(x,k)).join(' ').toLowerCase();
   return (!q||hay.includes(q)) && (!cat||val(x,fields.category)===cat) && (!meal||val(x,fields.meal)===meal) && (!station||val(x,fields.station)===station) && (!speed||val(x,fields.speed)===speed);
 });
 renderBrowse();
}
function renderBrowse(){
 $('#resultCount').textContent=`${current.length} specials found`;
 $('#specialCards').innerHTML=current.map(cardHTML).join('') || '<p class="meta">No specials found.</p>';
 attachCardClicks('#specialCards');
}
function cardHTML(x,i){const idx=data.indexOf(x);return `<article class="card" data-idx="${idx}"><h3>${esc(val(x,fields.name)||'Untitled')}</h3><div class="tags">${[val(x,fields.category),val(x,fields.meal),val(x,fields.speed)].filter(Boolean).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><p class="meta">Week ${esc(val(x,fields.week))} · ${esc(val(x,fields.date))}</p><p class="meta"><b>Protein:</b> ${esc(val(x,fields.primary)||val(x,fields.protein)||'—')}</p><p class="meta"><b>Sauce:</b> ${esc(val(x,fields.sauce)||'—')}</p></article>`;}
function attachCardClicks(root){$$(root+' .card').forEach(c=>c.onclick=()=>openDetail(data[Number(c.dataset.idx)]));}
function openDetail(x){$('#detailContent').innerHTML=`<p class="eyebrow">Week ${esc(val(x,fields.week))} · ${esc(val(x,fields.date))}</p><h2>${esc(val(x,fields.name))}</h2><div class="tags">${[val(x,fields.category),val(x,fields.meal),val(x,fields.station),val(x,fields.difficulty),val(x,fields.speed)].filter(Boolean).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><div class="detailGrid">${box('Ingredients',val(x,fields.ingredients))}${box('Sauce',val(x,fields.sauce))}${box('Protein',val(x,fields.primary)||val(x,fields.protein))}${box('Secondary Protein',val(x,fields.secondary))}${box('Station',val(x,fields.station))}${box('Repeat Candidate',val(x,fields.repeat))}${box('Egg Load',val(x,'Egg Station Load'))}${box('Flat Top Load',val(x,'Flat Top Load'))}${box('Fryer Load',val(x,'Fryer Load'))}</div>${val(x,fields.notes)?`<div class="detailBox" style="margin-top:10px"><small>Notes</small>${esc(val(x,fields.notes))}</div>`:''}`;$('#detailDialog').showModal();}
function box(label,content){return `<div class="detailBox"><small>${label}</small>${esc(content||'—')}</div>`;}
function renderWeeks(){const weeks={}; data.forEach(x=>{const w=val(x,fields.week)||'Unknown';(weeks[w]=weeks[w]||[]).push(x)}); const sorted=Object.keys(weeks).sort((a,b)=>(parseFloat(b)||0)-(parseFloat(a)||0)); $('#weekList').innerHTML=sorted.map(w=>`<details class="week"><summary>Week ${esc(w)} <span class="meta">${weeks[w].length} specials</span></summary><div class="weekItems">${weeks[w].map(x=>`<div class="weekItem"><b>${esc(val(x,fields.name))}</b><br><span class="meta">${esc(val(x,fields.category))} · ${esc(val(x,fields.ingredients)).slice(0,120)}</span></div>`).join('')}</div></details>`).join('');}
function suggestBalanced(){const wanted=['Benedict','Pancakes','Waffle','French Toast','Burger','Sandwich','Scramble','Omelette','Wrap','Salad','Avocado Toast']; const picked=[]; const recentWeeks=uniq(data.map(x=>val(x,fields.week))).slice(-8); wanted.forEach(cat=>{const pool=data.filter(x=>val(x,fields.category)===cat && !recentWeeks.includes(val(x,fields.week))); if(pool.length) picked.push(pool[Math.floor(Math.random()*pool.length)]);}); const final=[...picked.filter(x=>/Benedict|Avocado Toast/.test(val(x,fields.category))).slice(0,1),...picked.filter(x=>/Pancakes|Waffle|French Toast/.test(val(x,fields.category))).slice(0,1),...picked.filter(x=>/Burger|Sandwich/.test(val(x,fields.category))).slice(0,1),...picked.filter(x=>/Scramble|Omelette/.test(val(x,fields.category))).slice(0,1),...picked.filter(x=>/Wrap|Salad/.test(val(x,fields.category))).slice(0,1)]; $('#suggestions').innerHTML=final.map(cardHTML).join(''); attachCardClicks('#suggestions'); showToast('Suggestions loaded');}
function esc(s){return (s??'').toString().replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
function showToast(t){const d=document.createElement('div');d.className='copyToast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),1600)}
function setupInstall(){let deferred; window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('#installBtn').classList.remove('hidden');}); $('#installBtn').onclick=async()=>{if(deferred){deferred.prompt(); deferred=null; $('#installBtn').classList.add('hidden');}};}
init();
