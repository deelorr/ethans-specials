
const DATA = window.SPECIALS_DATA || [];
const els = {
  total: document.querySelector("#total"),
  cats: document.querySelector("#cats"),
  weeks: document.querySelector("#weeks"),
  repeats: document.querySelector("#repeats"),
  search: document.querySelector("#search"),
  category: document.querySelector("#category"),
  meal: document.querySelector("#meal"),
  week: document.querySelector("#week"),
  station: document.querySelector("#station"),
  cards: document.querySelector("#cards"),
  chips: document.querySelector("#chips"),
  clear: document.querySelector("#clear"),
  random: document.querySelector("#random"),
};
const clean = v => (v ?? "").toString().trim();
const uniq = arr => [...new Set(arr.filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
const categoryList = uniq(DATA.map(x=>clean(x.Category)));
const weekList = uniq(DATA.map(x=>clean(x.Week)));
const stationList = uniq(DATA.map(x=>clean(x.Station)));
function optionize(select, values, label){
  select.innerHTML = `<option value="">${label}</option>` + values.map(v=>`<option>${v}</option>`).join("");
}
optionize(els.category, categoryList, "All categories");
optionize(els.week, weekList, "All weeks");
optionize(els.station, stationList, "All stations");
els.total.textContent = DATA.length;
els.cats.textContent = categoryList.length;
els.weeks.textContent = weekList.length;
els.repeats.textContent = DATA.filter(x=>clean(x["Repeat Candidate"]).toLowerCase()==="yes").length;
els.chips.innerHTML = categoryList.map(c=>`<button class="chip" data-cat="${c}">${c}</button>`).join("");
function matches(item){
  const q = clean(els.search.value).toLowerCase();
  const blob = Object.values(item).map(clean).join(" ").toLowerCase();
  return (!q || blob.includes(q))
    && (!els.category.value || clean(item.Category) === els.category.value)
    && (!els.meal.value || clean(item["Meal Type"]) === els.meal.value)
    && (!els.week.value || clean(item.Week) === els.week.value)
    && (!els.station.value || clean(item.Station) === els.station.value);
}
function card(x){
  const meal = clean(x["Meal Type"]);
  return `<article class="card">
    <h2>${clean(x["Special Name"])}</h2>
    <div class="meta">
      <span class="badge">${clean(x.Week)} · ${clean(x["Date Range"])}</span>
      <span class="badge ${meal.toLowerCase()}">${meal}</span>
      <span class="badge">${clean(x.Category)}</span>
      ${clean(x["Repeat Candidate"])==="Yes" ? `<span class="badge">Repeat candidate</span>` : ""}
    </div>
    <div class="row"><span>Protein</span><div>${clean(x.Protein) || "—"}</div></div>
    <div class="row"><span>Ingredients</span><div>${clean(x.Ingredients) || "—"}</div></div>
    <div class="row"><span>Sauce</span><div>${clean(x.Sauce) || "—"}</div></div>
    <div class="row"><span>Station</span><div>${clean(x.Station) || "—"}</div></div>
    <div class="row"><span>Difficulty</span><div>${clean(x["Prep Difficulty"]) || "—"} · ${clean(x["Pickup Speed"]) || "—"} pickup</div></div>
    ${clean(x.Notes) ? `<div class="row"><span>Notes</span><div>${clean(x.Notes)}</div></div>` : ""}
    <div class="load">
      <div><b class="${clean(x["Egg Station Load"])}">${clean(x["Egg Station Load"]) || "—"}</b>Egg</div>
      <div><b class="${clean(x["Flat Top Load"])}">${clean(x["Flat Top Load"]) || "—"}</b>Flat top</div>
      <div><b class="${clean(x["Fryer Load"])}">${clean(x["Fryer Load"]) || "—"}</b>Fryer</div>
    </div>
  </article>`;
}
function render(){
  const filtered = DATA.filter(matches).sort((a,b)=>(Number(b["Week Number"])||0)-(Number(a["Week Number"])||0));
  els.cards.innerHTML = filtered.length ? filtered.map(card).join("") : `<div class="empty">No specials match those filters.</div>`;
  document.querySelectorAll(".chip").forEach(ch=>ch.classList.toggle("active", ch.dataset.cat===els.category.value));
}
document.querySelectorAll("input,select").forEach(el=>el.addEventListener("input",render));
els.chips.addEventListener("click", e=>{
  if(!e.target.matches(".chip")) return;
  els.category.value = els.category.value === e.target.dataset.cat ? "" : e.target.dataset.cat;
  render();
});
els.clear.addEventListener("click",()=>{["search","category","meal","week","station"].forEach(id=>els[id].value="");render();});
els.random.addEventListener("click",()=>{
  const buckets = ["Benedict","Pancakes","Burger","Scramble","Wrap"];
  const picks = buckets.map(cat=>{
    const options = DATA.filter(x=>clean(x.Category)===cat);
    return options[Math.floor(Math.random()*options.length)];
  }).filter(Boolean);
  els.cards.innerHTML = picks.map(card).join("");
});
render();
