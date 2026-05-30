const specials = window.SPECIALS_DATA || [];
console.log(`Ethan Specials App v2.5 iPhone optimized loaded: ${specials.length} specials`);
const $ = (id)=>document.getElementById(id);
const norm = (v)=>String(v ?? '').toLowerCase();
const val = (r,k)=>r[k] ?? '';
const splitList = (text)=> String(text || '')
  .split(/,|\+|\/| w\/ | with | and /i)
  .map(x=>x.trim())
  .filter(x=>x && x.length > 1)
  .map(x=>x.replace(/^topped w\/?\s*/i,'').replace(/^with\s+/i,'').trim());

function uniq(field){return [...new Set(specials.map(r=>val(r,field)).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true}));}
function fillSelect(id, field){ const s=$(id); uniq(field).forEach(v=>{const o=document.createElement('option'); o.value=v; o.textContent=v; s.appendChild(o);}); }
function card(r){
 const el=document.createElement('div'); el.className='card';
 el.innerHTML=`<h3>${val(r,'Special Name')}</h3><div class="muted">${val(r,'Week')} · ${val(r,'Date Range')}</div><div class="meta"><span class="tag">${val(r,'Category')||'—'}</span><span class="tag">${val(r,'Meal Type')||'—'}</span><span class="tag">${val(r,'Station')||'—'}</span></div><p>${val(r,'Ingredients')||'—'}</p><div class="muted">Sauce: ${val(r,'Sauce') || '—'} · Protein: ${val(r,'Primary Protein') || val(r,'Protein') || '—'}</div>`;
 el.onclick=()=>openModal(r); return el;
}
function openModal(r){ $('modalContent').innerHTML=`<h2>${val(r,'Special Name')}</h2><p class="muted">${val(r,'Week')} · ${val(r,'Date Range')} · ${val(r,'Year')||''}</p><div class="meta"><span class="tag">${val(r,'Category')||'—'}</span><span class="tag">${val(r,'Meal Type')||'—'}</span><span class="tag">Prep: ${val(r,'Prep Difficulty')||'—'}</span><span class="tag">Pickup: ${val(r,'Pickup Speed')||'—'}</span><span class="tag">Repeat: ${val(r,'Repeat Candidate')||'—'}</span></div><h3>Ingredients</h3><p>${val(r,'Ingredients') || '—'}</p><h3>Build</h3><p><strong>Protein:</strong> ${val(r,'Protein') || val(r,'Primary Protein') || '—'}<br><strong>Secondary:</strong> ${val(r,'Secondary Protein') || '—'}<br><strong>Sauce:</strong> ${val(r,'Sauce') || '—'}<br><strong>Station:</strong> ${val(r,'Station') || '—'}</p><h3>Load</h3><p>Egg: ${val(r,'Egg Station Load') || '—'} · Flat Top: ${val(r,'Flat Top Load') || '—'} · Fryer: ${val(r,'Fryer Load') || '—'}</p><h3>Notes</h3><p>${val(r,'Notes') || 'No notes yet.'}</p>`; $('modal').classList.remove('hidden'); }
function renderList(rows, target='specialCards'){ const wrap=$(target); wrap.innerHTML=''; rows.forEach(r=>wrap.appendChild(card(r))); if(target==='specialCards') $('resultCount').textContent=`${rows.length} specials shown`; }
function filterRows(){
 const q=norm($('search').value), cat=$('categoryFilter').value, week=$('weekFilter').value, meal=$('mealFilter').value, station=$('stationFilter').value;
 return specials.filter(r=> (!cat||val(r,'Category')===cat)&&(!week||val(r,'Week')===week)&&(!meal||val(r,'Meal Type')===meal)&&(!station||val(r,'Station')===station)&&(!q||norm(Object.values(r).join(' ')).includes(q)) );
}
function countBy(field){ const m={}; specials.forEach(r=>{const k=val(r,field)||'Unknown'; m[k]=(m[k]||0)+1}); return Object.entries(m).sort((a,b)=>b[1]-a[1]); }
function countTerms(){
 const m={};
 specials.forEach(r=>{
   const terms=[...splitList(val(r,'Ingredients')), ...splitList(val(r,'Sauce')), val(r,'Primary Protein'), val(r,'Secondary Protein')].filter(Boolean);
   [...new Set(terms.map(t=>t.trim()).filter(Boolean))].forEach(t=>{m[t]=(m[t]||0)+1});
 });
 return Object.entries(m).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
}
function statPanel(title, entries){return `<div class="panel"><h2>${title}</h2>${entries.slice(0,14).map(([k,v])=>`<div class="bar-row"><span>${k}</span><strong>${v}</strong></div>`).join('')}</div>`}
function renderIngredientCloud(filter=''){
 const wrap=$('ingredientCloud'); wrap.innerHTML='';
 const terms=countTerms().filter(([k])=>!filter || norm(k).includes(norm(filter))).slice(0,80);
 terms.forEach(([term,count])=>{
   const b=document.createElement('button'); b.className='chip'; b.innerHTML=`${term} <span>${count}</span>`;
   b.onclick=()=>showIngredient(term);
   wrap.appendChild(b);
 });
 if(!terms.length) wrap.innerHTML='<p class="muted">No ingredient matches found.</p>';
}
function showIngredient(term){
 const q=norm(term);
 const rows=specials.filter(r=>norm([val(r,'Ingredients'),val(r,'Sauce'),val(r,'Protein'),val(r,'Primary Protein'),val(r,'Secondary Protein')].join(' ')).includes(q));
 const categories={}; const proteins={};
 rows.forEach(r=>{categories[val(r,'Category')||'Unknown']=(categories[val(r,'Category')||'Unknown']||0)+1; proteins[val(r,'Primary Protein')||val(r,'Protein')||'Unknown']=(proteins[val(r,'Primary Protein')||val(r,'Protein')||'Unknown']||0)+1;});
 const topCats=Object.entries(categories).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k} (${v})`).join(', ');
 const topProteins=Object.entries(proteins).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k} (${v})`).join(', ');
 $('ingredientDetails').classList.remove('hidden');
 $('ingredientDetails').innerHTML=`<h2>${term}</h2><p><strong>${rows.length}</strong> specials found.</p><p class="muted"><strong>Top categories:</strong> ${topCats || '—'}<br><strong>Top proteins:</strong> ${topProteins || '—'}</p>`;
 renderList(rows,'ingredientResults');
}
function init(){
 if(window.navigator && window.navigator.standalone){ const tip=document.getElementById('iosInstallTip'); if(tip) tip.style.display='none'; }
 if(!specials.length){ document.body.innerHTML='<main><h1>No data loaded</h1><p>data.js did not load. Make sure index.html, app.js, styles.css, and data.js are in the same folder.</p></main>'; return; }
 fillSelect('categoryFilter','Category'); fillSelect('weekFilter','Week'); fillSelect('mealFilter','Meal Type'); fillSelect('stationFilter','Station');
 $('dashboardStats').innerHTML=`<div class="stat"><strong>${specials.length}</strong><span>Total specials</span></div><div class="stat"><strong>${uniq('Category').length}</strong><span>Categories</span></div><div class="stat"><strong>${uniq('Week').length}</strong><span>Weeks</span></div><div class="stat"><strong>${countTerms().length}</strong><span>Tracked ingredients</span></div>`;
 renderList(specials.slice(0,12),'quickResults'); renderList(specials);
 ['search','categoryFilter','weekFilter','mealFilter','stationFilter'].forEach(id=>$(id).addEventListener('input',()=>renderList(filterRows())));
 $('quickSearch').addEventListener('input',()=>{const q=norm($('quickSearch').value); renderList((q?specials.filter(r=>norm(Object.values(r).join(' ')).includes(q)):specials.slice(0,12)).slice(0,30),'quickResults')});
 const wl=$('weekList'); uniq('Week').reverse().forEach(w=>{const b=document.createElement('button'); b.className='week-pill'; b.textContent=w; b.onclick=()=>{document.querySelectorAll('.week-pill').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderList(specials.filter(r=>val(r,'Week')===w),'weekDetails')}; wl.appendChild(b)});
 $('statsOutput').innerHTML=statPanel('Categories',countBy('Category'))+statPanel('Proteins',countBy('Primary Protein'))+statPanel('Most Used Ingredients',countTerms())+statPanel('Station Load',countBy('Station'))+statPanel('Pickup Speed',countBy('Pickup Speed'));
 renderIngredientCloud();
 $('ingredientSearch').addEventListener('input',()=>renderIngredientCloud($('ingredientSearch').value));
 $('buildBtn').onclick=buildWeek;
 document.querySelectorAll('.bottom-nav button').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); $(btn.dataset.page).classList.add('active')});
 $('closeModal').onclick=()=>$('modal').classList.add('hidden'); $('modal').onclick=e=>{if(e.target.id==='modal') $('modal').classList.add('hidden')};
}
function buildWeek(){
 const templates={balanced:['Benedict','Pancakes|French Toast|Waffle','Burger|Sandwich|Melt','Scramble|Omelette|Breakfast Burrito','Wrap|Salad|Avocado Toast'],simple:['Sandwich','Burger','Wrap','Scramble','Pancakes|Waffle|French Toast'],breakfastHeavy:['Benedict','Scramble','Omelette','Pancakes|French Toast|Waffle','Avocado Toast']};
 const avoid=norm($('avoidInput').value).split(',').map(s=>s.trim()).filter(Boolean), prefer=norm($('preferInput').value).split(',').map(s=>s.trim()).filter(Boolean), chosen=[];
 for(const group of templates[$('templateSelect').value]){
   const cats=group.split('|');
   let pool=specials.filter(r=>cats.includes(val(r,'Category')) && !chosen.includes(r));
   pool=pool.filter(r=>!avoid.some(a=>norm(Object.values(r).join(' ')).includes(a)));
   pool.sort((a,b)=>{const ap=prefer.some(p=>norm(Object.values(a).join(' ')).includes(p))?1:0; const bp=prefer.some(p=>norm(Object.values(b).join(' ')).includes(p))?1:0; return bp-ap || (norm(a['Pickup Speed']).includes('fast')?-1:1)});
   if(pool[0]) chosen.push(pool[0]);
 }
 $('builderOutput').innerHTML='<div class="panel"><h2>Draft Week</h2><p>Use these as starting points, then refine sauce/prep based on current inventory.</p></div>'; chosen.forEach(r=>$('builderOutput').appendChild(card(r)));
}
init();
