let specials = window.SPECIALS_DATA || [];
const EMBEDDED_SPECIALS = window.SPECIALS_DATA || [];
console.log(`Ethan Specials App v3.0 sheet sync fix loaded: ${specials.length} embedded specials`);
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

function parseCSV(text){
 const rows=[]; let row=[]; let cell=''; let quote=false;
 for(let i=0;i<text.length;i++){
   const c=text[i], n=text[i+1];
   if(c==='"'){
     if(quote && n==='"'){ cell+='"'; i++; }
     else quote=!quote;
   } else if(c===',' && !quote){ row.push(cell); cell=''; }
   else if((c==='\n' || c==='\r') && !quote){
     if(c==='\r' && n==='\n') i++;
     row.push(cell); rows.push(row); row=[]; cell='';
   } else cell+=c;
 }
 if(cell.length || row.length){ row.push(cell); rows.push(row); }
 return rows.filter(r=>r.some(x=>String(x).trim()!==''));
}
function rowsToObjects(rows){
 if(!rows.length) return [];
 const headers=rows[0].map(h=>String(h).trim());
 return rows.slice(1).map(r=>{
   const obj={}; headers.forEach((h,i)=>obj[h]=String(r[i] ?? '').trim()); return obj;
 }).filter(r=>r['Special Name'] || r['Name'] || r['Special']);
}
function resetSelect(id, label){ const s=$(id); if(!s) return; s.innerHTML=`<option value="">${label}</option>`; }
function fillRandomSelects(){
 resetSelect('randomCategory','Any category'); resetSelect('randomMeal','Any meal type');
 fillSelect('randomCategory','Category'); fillSelect('randomMeal','Meal Type');
}
function refreshAll(){
 resetSelect('categoryFilter','All categories'); resetSelect('weekFilter','All weeks'); resetSelect('mealFilter','All meal types'); resetSelect('stationFilter','All stations');
 fillSelect('categoryFilter','Category'); fillSelect('weekFilter','Week'); fillSelect('mealFilter','Meal Type'); fillSelect('stationFilter','Station');
 fillRandomSelects();
 $('dashboardStats').innerHTML=`<div class="stat"><strong>${specials.length}</strong><span>Total specials</span></div><div class="stat"><strong>${uniq('Category').length}</strong><span>Categories</span></div><div class="stat"><strong>${uniq('Week').length}</strong><span>Weeks</span></div><div class="stat"><strong>${countTerms().length}</strong><span>Tracked ingredients</span></div>`;
 renderList(specials.slice(0,12),'quickResults'); renderList(filterRows());
 const wl=$('weekList'); wl.innerHTML=''; uniq('Week').reverse().forEach(w=>{const b=document.createElement('button'); b.className='week-pill'; b.textContent=w; b.onclick=()=>{document.querySelectorAll('.week-pill').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderList(specials.filter(r=>val(r,'Week')===w),'weekDetails')}; wl.appendChild(b)});
 $('statsOutput').innerHTML=statPanel('Categories',countBy('Category'))+statPanel('Proteins',countBy('Primary Protein'))+statPanel('Most Used Ingredients',countTerms())+statPanel('Station Load',countBy('Station'))+statPanel('Pickup Speed',countBy('Pickup Speed'));
 renderIngredientCloud($('ingredientSearch')?.value || '');
}
function setSyncStatus(msg,type=''){ const el=$('syncStatus'); if(!el) return; el.className=`sync-status ${type}`; el.textContent=msg; }
function normalizeSheetUrl(raw){
 let url=String(raw || '').trim();
 if(!url) return '';
 // Accept a normal Google Sheets sharing/edit URL and convert it to CSV export.
 const idMatch=url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
 const gidMatch=url.match(/[?#&]gid=([0-9]+)/);
 if(idMatch && !url.includes('/pub?') && !url.includes('/pubhtml') && !url.includes('output=csv') && !url.includes('format=csv')){
   const gid=gidMatch ? gidMatch[1] : '0';
   return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv&gid=${gid}`;
 }
 // Accept published web page links and convert pubhtml/pub to CSV.
 if(url.includes('/pubhtml')) url=url.replace('/pubhtml','/pub');
 if(url.includes('/pub?') && !url.includes('output=csv')){
   url += (url.includes('?') ? '&' : '?') + 'output=csv';
 }
 return url;
}
function validateCsvText(text){
 const sample=String(text || '').trim().slice(0,120).toLowerCase();
 if(!sample) throw new Error('The sheet returned an empty file.');
 if(sample.startsWith('<!doctype') || sample.startsWith('<html') || sample.includes('<html')){
   throw new Error('That link returned a web page, not CSV. Use File → Share → Publish to web → CSV, or paste a normal Google Sheets edit link and let this app convert it.');
 }
}
async function loadFromSheetUrl(url){
 const cleanUrl=normalizeSheetUrl(url);
 const res=await fetch(cleanUrl, {cache:'no-store'});
 if(!res.ok) throw new Error(`Could not fetch sheet (${res.status}). Make sure the sheet is public or published to web.`);
 const text=await res.text();
 validateCsvText(text);
 const rows=parseCSV(text);
 if(!rows.length) throw new Error('No rows found in CSV.');
 const headers=rows[0].map(h=>String(h).trim()).filter(Boolean);
 const objects=rowsToObjects(rows);
 if(!objects.length){
   throw new Error(`CSV loaded, but no specials were found. First columns found: ${headers.slice(0,8).join(', ') || 'none'}. Make sure the sheet tab has a header called Special Name.`);
 }
 specials=objects; refreshAll();
 localStorage.setItem('ethansSpecialsSheetUrl', url);
 localStorage.setItem('ethansSpecialsResolvedCsvUrl', cleanUrl);
 localStorage.setItem('ethansSpecialsLastSync', new Date().toLocaleString());
 setSyncStatus(`Live sheet loaded: ${specials.length} specials. Last sync: ${localStorage.getItem('ethansSpecialsLastSync')}`,'ok');
}
function setupSheetSync(){
 const input=$('sheetUrlInput'); if(!input) return;
 const saved=localStorage.getItem('ethansSpecialsSheetUrl') || '';
 input.value=saved;
 if(saved){ setSyncStatus('Saved sheet link found. Tap Sync Now to refresh live data.','warn'); }
 $('saveSheetUrlBtn').onclick=()=>{ localStorage.setItem('ethansSpecialsSheetUrl', input.value.trim()); const resolved=normalizeSheetUrl(input.value.trim()); localStorage.setItem('ethansSpecialsResolvedCsvUrl', resolved); setSyncStatus('Sheet link saved. Tap Sync Now to load it.','ok'); };
 $('syncSheetBtn').onclick=async()=>{ const url=input.value.trim() || localStorage.getItem('ethansSpecialsSheetUrl'); if(!url){ setSyncStatus('Paste a Google Sheets link first. A normal edit link or published CSV link both work in v3.0.','bad'); return; } setSyncStatus('Syncing live sheet...','warn'); try{ await loadFromSheetUrl(url); }catch(e){ console.error(e); specials=EMBEDDED_SPECIALS; refreshAll(); setSyncStatus(`Live sync failed. Still using embedded data. ${e.message}`,'bad'); } };
 $('clearSheetUrlBtn').onclick=()=>{ localStorage.removeItem('ethansSpecialsSheetUrl'); localStorage.removeItem('ethansSpecialsResolvedCsvUrl'); localStorage.removeItem('ethansSpecialsLastSync'); input.value=''; specials=EMBEDDED_SPECIALS; refreshAll(); setSyncStatus(`Using embedded fallback data: ${specials.length} specials.`,'warn'); };
}


function randomizeArray(arr){
 const copy=[...arr];
 for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]];}
 return copy;
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function oneOf(arr, avoid=[]){
 const clean=arr.filter(x=>x && !avoid.some(a=>norm(x).includes(a)));
 return pick(clean.length ? clean : arr);
}
function titleCase(s){ return String(s||'').replace(/\w\S*/g, w=>w[0].toUpperCase()+w.slice(1).toLowerCase()); }
function words(list){ return list.filter(Boolean).join(', '); }
function tokenList(text){ return norm(text).split(',').map(s=>s.trim()).filter(Boolean); }

function cleanTerm(t){
 return String(t||'').toLowerCase()
  .replace(/\b(toasted|grilled|crispy|chopped|shredded|sliced|house|fresh|big|small|choice of|topped|with|drizzle|sauce)\b/g,'')
  .replace(/[^a-z0-9\s]/g,' ')
  .replace(/\s+/g,' ')
  .trim();
}
function rowTerms(r){
 const raw=[...splitList(val(r,'Ingredients')), ...splitList(val(r,'Sauce')), val(r,'Primary Protein'), val(r,'Secondary Protein'), val(r,'Protein')].filter(Boolean);
 const terms=[...new Set(raw.map(cleanTerm).filter(t=>t && t.length>1 && !['of','the','w'].includes(t)))];
 return terms;
}
function buildFlavorGraph(){
 const termCounts={}; const pairCounts={};
 specials.forEach(r=>{
   const terms=rowTerms(r);
   terms.forEach(t=>termCounts[t]=(termCounts[t]||0)+1);
   for(let i=0;i<terms.length;i++) for(let j=i+1;j<terms.length;j++){
     const pair=[terms[i],terms[j]].sort().join('||');
     pairCounts[pair]=(pairCounts[pair]||0)+1;
   }
 });
 return {termCounts,pairCounts};
}
function pairScore(a,b){
 const g=buildFlavorGraph();
 const key=[cleanTerm(a),cleanTerm(b)].sort().join('||');
 return g.pairCounts[key]||0;
}
function weightedPick(items, context=[], avoid=[]){
 const cleanItems=[...new Set(items.filter(Boolean))].filter(x=>!avoid.some(a=>norm(x).includes(a)));
 const pool=cleanItems.length?cleanItems:items.filter(Boolean);
 if(!pool.length) return '';
 const g=buildFlavorGraph();
 const weighted=[];
 pool.forEach(item=>{
   const ct=cleanTerm(item);
   let w=1 + Math.min(10, g.termCounts[ct]||0);
   context.forEach(c=>{ w += Math.min(8, pairScore(item,c)*2); });
   for(let i=0;i<w;i++) weighted.push(item);
 });
 return pick(weighted.length?weighted:pool);
}
function applySparkMode(profile, mode){
 const p={...profile, sauces:[...profile.sauces], cheeses:[...profile.cheeses], toppings:[...profile.toppings], crunch:[...profile.crunch], acid:[...profile.acid], proteins:[...profile.proteins]};
 if(mode==='wildcard'){
   p.sauces.push('gochujang glaze','kimchi ranch','harissa aioli','chimichurri','lemon feta crema','hot maple','pimento cheese spread','green goddess','miso honey butter');
   p.cheeses.push('whipped ricotta','goat cheese','smoked gouda','havarti','cotija','pimento cheese');
   p.toppings.push('kimchi slaw','pickled Fresno chiles','cucumber relish','fried capers','charred pineapple','peach pepper jam','roasted mushrooms','crispy prosciutto','herb salad');
   p.crunch.push('garlic crunch','fried shallots','tostada crunch','parm crisp','potato sticks','cornflake crunch');
   p.acid.push('pickled Fresno chiles','lemon squeeze','cucumber relish','pepperoncini','quick pickled onion','lime crema');
   p.proteins.push('fried cod','tri tip','pulled pork','smoked salmon','crispy pork belly','roasted mushrooms','blackened chicken');
   p.label = p.label + ' + Wild Card';
  }
 return p;
}
function modeReason(mode){
 if(mode==='house') return 'House Style mode weights ingredients and pairings that already appear together in your specials database.';
 if(mode==='wildcard') return 'Wild Card mode keeps the kitchen logic, but opens the pantry up with outside ingredients for fresher sparks.';
 return 'Creative Mix mode uses the prebuilt spark rules you liked: flavor profile, format, sauce, cheese, crunch, and acid.';
}

function profilePool(){
 return {
  classic:{label:'Classic diner', sauces:['garlic aioli','1000 island','mayo','hollandaise','burger sauce','ranch'], cheeses:['American','cheddar','Swiss','pepper jack'], toppings:['bacon','tomato','shredded lettuce','grilled onion','pickles','avocado'], crunch:['hash browns','crispy potatoes','bacon crumble'], acid:['pickles','tomato','pico de gallo'], proteins:['burger patty','grilled chicken','ham','turkey','bacon','shaved steak']},
  southwest:{label:'Southwest / Mexican', sauces:['chipotle aioli','lime crema','verde sauce','ranchero sauce','salsa','chilaquiles sauce'], cheeses:['pepper jack','cheddar','queso fresco','Swiss'], toppings:['pico de gallo','avocado','roasted corn','green onion','jalapeños','tortilla strips'], crunch:['crispy tortillas','tortilla strips','crispy potatoes'], acid:['pico de gallo','lime squeeze','pickled onion'], proteins:['shredded chicken','chorizo','carnitas','burger patty','bacon']},
  bbq:{label:'BBQ / Smokehouse', sauces:['BBQ sauce','garlic aioli','chipotle aioli','ranch','honey mustard'], cheeses:['cheddar','pepper jack','American','Swiss'], toppings:['bacon','grilled onion','pickles','crispy potatoes','slaw','green onion'], crunch:['crispy onions','BBQ chips','bacon crumble','crispy potatoes'], acid:['pickles','slaw','tomato'], proteins:['burger patty','shredded chicken','pastrami','tri tip','bacon','pulled pork']},
  deli:{label:'Deli / Melt', sauces:['garlic aioli','mayo','1000 island','Dijon','burger sauce'], cheeses:['Swiss','cheddar','American','provolone'], toppings:['pickles','grilled onion','tomato','shredded lettuce','arugula'], crunch:['pickles','chips','crispy onions'], acid:['pickles','tomato','marinated tomato'], proteins:['ham','turkey','pastrami','shaved steak','burger patty','bacon']},
  california:{label:'Fresh California', sauces:['garlic aioli','chipotle aioli','balsamic drizzle','lime crema','ranch'], cheeses:['feta','mozzarella','Swiss','pepper jack'], toppings:['avocado','marinated tomato','arugula','cucumber','red onion','strawberries','green onion'], crunch:['walnuts','cucumber','bacon crumble'], acid:['balsamic vinaigrette','marinated tomato','red onion','lime squeeze'], proteins:['grilled chicken','turkey','smoked salmon','crab','bacon','shredded chicken']},
  southern:{label:'Southern comfort', sauces:['country gravy','hollandaise','hot honey','honey mustard','ranch','BBQ sauce'], cheeses:['cheddar','American','pepper jack','cream cheese'], toppings:['bacon','green onion','crispy potatoes','tomato','pickles'], crunch:['fried chicken','crispy potatoes','biscuit crumble','bacon crumble'], acid:['pickles','tomato','pico de gallo'], proteins:['crispy chicken','bacon','ham','burger patty','shredded chicken']},
  italian:{label:'Italian-ish', sauces:['garlic aioli','balsamic drizzle','marinara','pesto','hollandaise'], cheeses:['mozzarella','provolone','Swiss','feta','parmesan'], toppings:['marinated tomato','arugula','red onion','avocado','green onion'], crunch:['toasted sourdough','crispy prosciutto','bacon crumble'], acid:['balsamic drizzle','marinated tomato','red onion'], proteins:['grilled chicken','ham','turkey','shaved steak','bacon']},
  spicy:{label:'Spicy', sauces:['chipotle aioli','buffalo ranch','hot honey','ranchero sauce','verde sauce'], cheeses:['pepper jack','cheddar','American','cream cheese'], toppings:['jalapeños','pico de gallo','green onion','pickles','roasted corn'], crunch:['crispy chicken','tortilla strips','crispy potatoes','bacon crumble'], acid:['pickles','pico de gallo','lime squeeze'], proteins:['crispy chicken','chorizo','burger patty','shredded chicken','bacon']}
 };
}
const categoryRules={
 'Burger':{meal:'Lunch', bases:['brioche bun','Texas toast','toasted roll'], proteins:['burger patty','shaved steak','crispy chicken'], required:['cheese','sauce','crunch','acid'], station:'Flat Top', template:(x)=>`${x.profileWord} ${x.proteinWord} Burger`},
 'Sandwich':{meal:'Lunch', bases:['toasted sourdough','Texas toast','toasted white bread','toasted roll'], proteins:['grilled chicken','turkey','ham','pastrami','shaved steak','crispy chicken'], required:['cheese','sauce','acid'], station:'Flat Top / Sandwich', template:(x)=>`${x.profileWord} ${x.proteinWord} Sandwich`},
 'Melt':{meal:'Lunch', bases:['grilled sourdough','Texas toast','rye'], proteins:['burger patty','pastrami','turkey','shaved steak','grilled chicken'], required:['cheese','sauce','acid'], station:'Flat Top', template:(x)=>`${x.profileWord} ${x.proteinWord} Melt`},
 'Wrap':{meal:'Lunch', bases:['grilled tortilla','flour tortilla'], proteins:['grilled chicken','shredded chicken','crispy chicken','turkey'], required:['sauce','crunch','acid'], station:'Cold / Flat Top', template:(x)=>`${x.profileWord} ${x.proteinWord} Wrap`},
 'Salad':{meal:'Lunch', bases:['chopped romaine','mixed greens'], proteins:['grilled chicken','turkey','smoked salmon','crispy chicken'], required:['cheese','crunch','acid'], station:'Cold Line', template:(x)=>`${x.profileWord} ${x.proteinWord} Salad`},
 'Benedict':{meal:'Breakfast', bases:['English muffin','crispy tortillas','big sourdough','biscuit'], proteins:['ham','bacon','crab','chorizo','smoked salmon','shaved steak'], required:['sauce','acid'], station:'Egg Station', template:(x)=>`${x.profileWord} ${x.proteinWord} Benedict`},
 'Scramble':{meal:'Breakfast', bases:['scrambled eggs'], proteins:['bacon','chorizo','shredded chicken','ham','sausage'], required:['cheese','sauce','acid'], station:'Egg Station', template:(x)=>`${x.profileWord} ${x.proteinWord} Scramble`},
 'Omelette':{meal:'Breakfast', bases:['three egg omelette'], proteins:['ham','bacon','shredded chicken','sausage','turkey'], required:['cheese','sauce'], station:'Egg Station', template:(x)=>`${x.profileWord} ${x.proteinWord} Omelette`},
 'Breakfast Burrito':{meal:'Breakfast', bases:['flour tortilla','crispy potatoes','scrambled eggs'], proteins:['bacon','chorizo','ham','carnitas','shredded chicken'], required:['cheese','sauce','acid'], station:'Egg / Flat Top', template:(x)=>`${x.profileWord} ${x.proteinWord} Breakfast Burrito`},
 'Avocado Toast':{meal:'Breakfast', bases:['big sourdough','avocado'], proteins:['bacon','smoked salmon','turkey','crab','grilled chicken'], required:['acid','crunch'], station:'Cold / Egg', template:(x)=>`${x.profileWord} ${x.proteinWord} Avo Toast`},
 'Pancakes':{meal:'Breakfast', bases:['pancakes'], proteins:['bacon'], required:['sweet','crunch'], station:'Griddle', template:(x)=>`${x.sweetWord} Pancakes`},
 'French Toast':{meal:'Breakfast', bases:['French toast'], proteins:['bacon'], required:['sweet','crunch'], station:'Griddle', template:(x)=>`${x.sweetWord} French Toast`},
 'Waffle':{meal:'Breakfast', bases:['waffle'], proteins:['bacon'], required:['sweet','crunch'], station:'Waffle / Griddle', template:(x)=>`${x.sweetWord} Waffle`}
};
const sweetProfiles=[
 {name:'Banana Cream', toppings:['banana pudding','sliced banana','vanilla wafer crumble','whipped cream'], sauce:'caramel drizzle'},
 {name:'Cookies N Cream', toppings:['Oreo crumble','sweet cream','whipped cream'], sauce:'chocolate drizzle'},
 {name:'Caramel Apple', toppings:['cinnamon apple compote','whipped cream','powdered sugar'], sauce:'caramel drizzle'},
 {name:'Berry Cheesecake', toppings:['strawberries','cheesecake drizzle','graham crumble','whipped cream'], sauce:'strawberry sauce'},
 {name:'Nutella Bacon Banana', toppings:['Nutella','sliced banana','bacon crumble','powdered sugar'], sauce:'chocolate drizzle'},
 {name:'Fruity Pebble Crunch', toppings:['Fruity Pebbles','sweet cream','whipped cream'], sauce:'vanilla drizzle'}
];
function historicalBoost(term){
 const q=norm(term);
 return specials.filter(r=>norm(Object.values(r).join(' ')).includes(q)).length;
}
function smartCategory(){
 const selected=$('randomCategory')?.value;
 if(selected) return selected;
 const meal=$('randomMeal')?.value;
 const cats=Object.keys(categoryRules).filter(c=>!meal || categoryRules[c].meal===meal);
 return pick(cats);
}
function smartProfile(cat){
 const selected=$('ideaProfile')?.value;
 const profiles=profilePool();
 if(selected && profiles[selected]) return {key:selected, ...profiles[selected]};
 const allowed = ['Pancakes','French Toast','Waffle'].includes(cat) ? ['classic'] : Object.keys(profiles);
 const key=pick(allowed);
 return {key, ...profiles[key]};
}
function makeIdea(slotLabel='New Idea'){
 const avoid=tokenList($('randomAvoid')?.value || '');
 const prefer=tokenList($('randomPrefer')?.value || '');
 const mode=$('sparkMode')?.value || 'balanced';
 const cat=smartCategory();
 const rule=categoryRules[cat] || categoryRules['Sandwich'];
 let profile=applySparkMode(smartProfile(cat), mode);
 if(['Pancakes','French Toast','Waffle'].includes(cat)){
   const sweet=oneOf(sweetProfiles, avoid);
   const base=rule.bases[0];
   const name=rule.template({sweetWord:sweet.name});
   const ingredients=[base, ...sweet.toppings, sweet.sauce].filter(x=>!avoid.some(a=>norm(x).includes(a)));
   const reasons=['Sweet breakfast slot gives the week a clear comfort item.','Uses a base your kitchen already understands.','Crunch + cream + sauce keeps it from feeling flat.', modeReason(mode)];
   return {slotLabel, name, category:cat, meal:'Breakfast', profile: mode==='wildcard' ? 'Sweet breakfast + Wild Card' : 'Sweet breakfast', protein:'Optional bacon', base, cheese:'—', sauce:sweet.sauce, toppings:sweet.toppings, ingredients, station:rule.station, score:78+Math.floor(Math.random()*16), reasons};
 }
 let protein = prefer.find(p=>profile.proteins.some(x=>norm(x).includes(p))) || (mode==='house' ? weightedPick([...profile.proteins, ...rule.proteins], [], avoid) : oneOf([...profile.proteins, ...rule.proteins], avoid));
 let context=[protein, cat];
 let cheese = mode==='house' ? weightedPick(profile.cheeses, context, avoid) : oneOf(profile.cheeses, avoid);
 context.push(cheese);
 let sauce = prefer.find(p=>profile.sauces.some(x=>norm(x).includes(p))) || (mode==='house' ? weightedPick(profile.sauces, context, avoid) : oneOf(profile.sauces, avoid));
 context.push(sauce);
 let base = mode==='house' ? weightedPick(rule.bases, context, avoid) : oneOf(rule.bases, avoid);
 let crunch = mode==='house' ? weightedPick(profile.crunch, context, avoid) : oneOf(profile.crunch, avoid);
 let acid = mode==='house' ? weightedPick(profile.acid, context, avoid) : oneOf(profile.acid, avoid);
 let toppingA = mode==='house' ? weightedPick(profile.toppings, context, avoid) : oneOf(profile.toppings, avoid);
 context.push(toppingA);
 let toppingB = mode==='house' ? weightedPick(profile.toppings.filter(t=>t!==toppingA), context, avoid) : oneOf(profile.toppings.filter(t=>t!==toppingA), avoid);
 const profileWord = profile.key==='classic' ? 'Diner' : profile.label.split('/')[0].trim();
 const proteinWord = titleCase(String(protein).replace('burger patty','Burger').replace('shredded ','').replace('grilled ','').replace('crispy ',''));
 const name=rule.template({profileWord, proteinWord});
 const ingredients=[base, protein, cheese, sauce, toppingA, toppingB, crunch, acid]
   .filter(Boolean)
   .filter((x,i,a)=>a.findIndex(y=>norm(y)===norm(x))===i)
   .filter(x=>!avoid.some(a=>norm(x).includes(a)));
 const historyBonus = Math.min(10,historicalBoost(protein)) + Math.min(8,historicalBoost(sauce)) + (mode==='house'?8:0) - (mode==='wildcard'?4:0);
 const score = Math.min(96, 62 + Math.floor(Math.random()*12) + historyBonus + (prefer.some(p=>norm(ingredients.join(' ')).includes(p))?8:0));
 const reasons=[
  modeReason(mode),
  `${profile.label} profile keeps the ingredients in the same lane.`,
  `${sauce} gives the special a clear sauce identity.`,
  `${acid} adds brightness so it does not eat too heavy.`,
  `${crunch} gives texture and makes the build feel intentional.`
 ];
 if(rule.station) reasons.push(`Main station: ${rule.station}.`);
 return {slotLabel, name, category:cat, meal:rule.meal, profile:profile.label, protein, base, cheese, sauce, toppings:[toppingA,toppingB,crunch,acid].filter(Boolean), ingredients, station:rule.station, score, reasons};
}
function ideaCard(idea){
 const el=document.createElement('div'); el.className='card idea-card';
 el.innerHTML=`
   <div class="slot-label">${idea.slotLabel}</div>
   <h3>${idea.name}</h3>
   <div class="meta"><span class="tag">${idea.category}</span><span class="tag">${idea.meal}</span><span class="tag">${idea.profile}</span><span class="tag">Fit: ${idea.score}%</span></div>
   <p><strong>Build:</strong> ${words(idea.ingredients)}</p>
   <p class="muted"><strong>Sauce:</strong> ${idea.sauce} · <strong>Station:</strong> ${idea.station}</p>
   <details><summary>Why it works</summary><ul>${idea.reasons.map(r=>`<li>${r}</li>`).join('')}</ul></details>
 `;
 return el;
}
function renderIdeas(ideas, title='New Special Ideas'){
 const out=$('randomOutput');
 out.innerHTML=`<div class="panel"><h2>${title}</h2><p class="muted">These are spark ideas, not locked recipes. Use the logic notes to decide what to keep, cut, or rename.</p></div>`;
 ideas.forEach(idea=>out.appendChild(ideaCard(idea)));
}
function makeOneIdea(){ renderIdeas([makeIdea('Single Spark')],'Smart Special Idea'); }
function makeFiveIdeas(){ renderIdeas(Array.from({length:5},(_,i)=>makeIdea(`Idea ${i+1}`)),'5 Smart Special Ideas'); }
function makeWeekIdeas(){
 const slots=[
  ['Premium Breakfast','Benedict'],
  ['Sweet Breakfast',pick(['Pancakes','French Toast','Waffle'])],
  ['Lunch Main',pick(['Burger','Sandwich','Melt'])],
  ['Egg Dish',pick(['Scramble','Omelette','Breakfast Burrito'])],
  ['Light / Fresh',pick(['Wrap','Salad','Avocado Toast'])]
 ];
 const oldCat=$('randomCategory').value;
 const ideas=[];
 slots.forEach(([slot,cat])=>{ $('randomCategory').value=cat; ideas.push(makeIdea(slot)); });
 $('randomCategory').value=oldCat;
 renderIdeas(ideas,'Smart Full Week Sparks');
}
function setupRandomizer(){
 fillRandomSelects();
 $('randomOneBtn')?.addEventListener('click', makeOneIdea);
 $('randomThreeBtn')?.addEventListener('click', makeFiveIdeas);
 $('randomWeekBtn')?.addEventListener('click', makeWeekIdeas);
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
 setupRandomizer();
 document.querySelectorAll('.bottom-nav button').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); $(btn.dataset.page).classList.add('active')});
 $('closeModal').onclick=()=>$('modal').classList.add('hidden'); $('modal').onclick=e=>{if(e.target.id==='modal') $('modal').classList.add('hidden')};
 setupSheetSync();
 const savedUrl=localStorage.getItem('ethansSpecialsSheetUrl');
 if(savedUrl){ loadFromSheetUrl(savedUrl).catch(e=>{ console.warn(e); setSyncStatus(`Auto-sync failed. Using embedded data. ${e.message}`,'bad'); }); }
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
