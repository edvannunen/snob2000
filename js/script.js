/* ============ SNOB 2000 DASHBOARD ============ */
const DATA = SNOB_DATA;
const YEARS = DATA.years;
const SONGS = DATA.songs;
const CUR_YEAR = YEARS[YEARS.length-1]; // 2025
const PALETTE = ['#c80000','#0c0c0d','#dd3d25','#52011c','#1e7d3c','#5b7fa6','#a9762c'];

/* ---------- helpers ---------- */
function isNum(v){ return typeof v === 'number'; }
function posIn(song, year){ const v = song.p[String(year)]; return isNum(v) ? v : null; }
function codeIn(song, year){ const v = song.p[String(year)]; return (typeof v === 'string') ? v : null; }
function chartedYearsList(song){ return YEARS.filter(y => isNum(posIn(song,y))); }
function currentRank(song){
  for(let i=YEARS.length-1;i>=0;i--){ const y=YEARS[i]; const p=posIn(song,y); if(p!==null) return {year:y, pos:p}; }
  return null;
}
function fmtNum(n){ return n.toLocaleString('nl-NL'); }
function esc(s){ return (s+'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function songLabel(song){ return `${song.a} — ${song.t}`; }

/* ============ TAB FRAMEWORK ============ */
const TABS = [
  {id:'overzicht', label:'Overzicht'},
  {id:'halloffame', label:'Hall of Fame'},
  {id:'stijgers', label:'Stijgers & dalers'},
  {id:'nieuw', label:'Nieuwkomers'},
  {id:'zoeken', label:'Zoek & vergelijk'},
  {id:'artiesten', label:'Artiesten'},
  {id:'decennia', label:'Jaartallen'},
  {id:'jaaroverzicht', label:'Jaaroverzicht'},
];

const nav = document.getElementById('nav');
const main = document.getElementById('main');
const rendered = {};

TABS.forEach(t=>{
  const btn = document.createElement('button');
  btn.textContent = t.label;
  btn.dataset.tab = t.id;
  btn.addEventListener('click', ()=> activate(t.id));
  nav.appendChild(btn);

  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.id = 'panel-'+t.id;
  main.appendChild(panel);
});

function activate(id){
  document.querySelectorAll('nav button').forEach(b=> b.classList.toggle('active', b.dataset.tab===id));
  document.querySelectorAll('section.panel').forEach(p=> p.classList.toggle('active', p.id==='panel-'+id));
  if(!rendered[id]){ RENDERERS[id](); rendered[id]=true; }
  window.scrollTo({top:0, behavior:'instant'});
}

/* ---------- add-to-compare button (used across every song table) ---------- */
function addBtnHtml(id){
  return `<td class="add-col"><button class="add-compare-btn" data-add="${id}" title="Toevoegen aan de 'Zoek &amp; Vergelijk' pagina">+</button></td>`;
}
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-add]');
  if(btn) addCompare(parseInt(btn.dataset.add));
});

let toastTimer = null;
function showToast(message){
  let toast = document.getElementById('toast');
  if(!toast){
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> toast.classList.remove('show'), 3000);
}

/* ============ 1. OVERZICHT ============ */
function renderOverzicht(){
  const panel = document.getElementById('panel-overzicht');

  const totalSongs = SONGS.length;
  const all14 = SONGS.filter(s=> chartedYearsList(s).length === YEARS.length);
  const artistCounts = new Map();
  SONGS.forEach(s=>{ const k=s.a.trim().toLowerCase(); artistCounts.set(k, (artistCounts.get(k)||0)+1); });
  const oneHitArtists = Array.from(artistCounts.values()).filter(c=>c===1).length;

  let recordHolder = SONGS[0], recordCount = 0;
  SONGS.forEach(s=>{ const c = chartedYearsList(s).length; if(c>recordCount){recordCount=c; recordHolder=s;} });

  // best-ever debut (first appearance in a year > first dataset year, lowest position)
  let bestDebut = null;
  SONGS.forEach(s=>{
    const cy = chartedYearsList(s);
    if(cy.length===0) return;
    const firstYear = cy[0];
    if(firstYear === YEARS[0]) return; // no prior data to call it a "debut"
    const pos = posIn(s, firstYear);
    if(!bestDebut || pos < bestDebut.pos){ bestDebut = {song:s, year:firstYear, pos}; }
  });

  // newcomers per year (turnover)
  const turnoverYears = YEARS.slice(1);
  const turnover = turnoverYears.map(y=>{
    let count=0;
    SONGS.forEach(s=>{
      if(posIn(s,y)===null) return;
      const earlierCharted = YEARS.filter(yy=> yy<y).some(yy=> isNum(posIn(s,yy)));
      if(!earlierCharted) count++;
    });
    return count;
  });
  const newThisYear = turnover[turnover.length-1];

  // biggest riser of current year
  const prevY = CUR_YEAR - 1;
  let biggestRiser = null;
  SONGS.forEach(s=>{
    const p1 = posIn(s,prevY), p2 = posIn(s,CUR_YEAR);
    if(p1!==null && p2!==null){
      const delta = p1-p2;
      if(!biggestRiser || delta > biggestRiser.delta) biggestRiser = {song:s, p1, p2, delta};
    }
  });

  // current top 5
  const top5 = SONGS.filter(s=> isNum(posIn(s,CUR_YEAR))).sort((a,b)=> posIn(a,CUR_YEAR)-posIn(b,CUR_YEAR)).slice(0,5);

  // release year with the most songs
  const releaseYearCounts = new Map();
  SONGS.forEach(s=>{ if(s.y){ releaseYearCounts.set(s.y, (releaseYearCounts.get(s.y)||0)+1); } });
  let topReleaseYear = null;
  releaseYearCounts.forEach((count, year)=>{ if(!topReleaseYear || count > topReleaseYear.count){ topReleaseYear = {year, count}; } });

  panel.innerHTML = `
    <div class="section-head">
      <span class="kicker">Snapshot</span>
      <h2>Overzicht</h2>
      <p>De lijst in cijfers: van alle ${fmtNum(totalSongs)} nummers die ooit in de SNOB 2000 stonden tot de nieuwste ontwikkelingen in editie ${CUR_YEAR}.</p>
    </div>
    <div class="kpi-grid">
      <div class="kpi"><div class="num">${fmtNum(totalSongs)}</div><div class="label">Unieke nummers ooit genoteerd</div><div class="sub">2012 &ndash; ${CUR_YEAR}</div></div>
      <div class="kpi"><div class="num">${fmtNum(all14.length)}</div><div class="label">Nummers alle ${YEARS.length} jaar genoteerd</div></div>
      <div class="kpi"><div class="num">${fmtNum(artistCounts.size)}</div><div class="label">Unieke artiesten</div></div>
      <div class="kpi"><div class="num">${fmtNum(oneHitArtists)}</div><div class="label">Artiesten met precies 1 nummer</div></div>
      <div class="kpi"><div class="num">${recordCount}<small> jr</small></div><div class="label">Record: meeste jaren genoteerd</div><div class="sub">${esc(songLabel(recordHolder))}${all14.length>1 ? ` + nog ${all14.length-1}` : ''}</div></div>
      <div class="kpi"><div class="num">${fmtNum(newThisYear)}</div><div class="label">Nieuwe binnenkomers in ${CUR_YEAR}</div></div>
      ${topReleaseYear ? `<div class="kpi"><div class="num">${topReleaseYear.year}</div><div class="label">Het jaartal met de meeste nummers over alle jaren</div><div class="sub">${fmtNum(topReleaseYear.count)} nummers</div></div>` : ''}
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Verloop per jaargang <span class="tag">nieuwe binnenkomers</span></h3>
        <canvas id="turnoverChart" height="220"></canvas>
      </div>
      <div class="card">
        <h3>Top 5 van dit moment <span class="tag">${CUR_YEAR}</span></h3>
        <table>
          <tbody>
          ${top5.map(s=> `<tr><td class="rank">${posIn(s,CUR_YEAR)}</td><td class="artist-name">${esc(s.a)}</td><td class="title-name">${esc(s.t)}</td>${addBtnHtml(s.id)}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>Beste ooit-debuut</h3>
        ${bestDebut ? `
          <div style="padding:10px 0;">
            <div class="mono" style="font-size:42px;color:var(--red);line-height:1;">#${bestDebut.pos}</div>
            <div class="artist-name" style="margin-top:10px;font-size:16px;">${esc(bestDebut.song.a)}</div>
            <div class="title-name">${esc(bestDebut.song.t)}</div>
            <div class="sub mono" style="margin-top:8px;color:#a19c8e;">binnengekomen in ${bestDebut.year}</div>
          </div>
          <p style="font-size:12.5px;color:#8a8578;margin-top:8px;">Hoogste ooit binnengekomen nieuwkomer sinds start van de meting (${YEARS[0]}). Meer debuten onder Nieuwkomers.</p>
        ` : ''}
      </div>
      <div class="card">
        <h3>Grootste stijger van ${CUR_YEAR}</h3>
        ${biggestRiser ? `
          <div style="padding:10px 0;">
            <div class="mono" style="font-size:42px;color:var(--up);line-height:1;">&#9650; ${biggestRiser.delta}</div>
            <div class="artist-name" style="margin-top:10px;font-size:16px;">${esc(biggestRiser.song.a)}</div>
            <div class="title-name">${esc(biggestRiser.song.t)}</div>
            <div class="sub mono" style="margin-top:8px;color:#a19c8e;">van #${biggestRiser.p1} (${prevY}) naar #${biggestRiser.p2} (${CUR_YEAR})</div>
          </div>
          <p style="font-size:12.5px;color:#8a8578;margin-top:8px;">Meer stijgers en dalers, ook van eerdere jaargangen, onder Stijgers &amp; dalers.</p>
        ` : ''}
      </div>
    </div>
  `;

  new Chart(document.getElementById('turnoverChart'), {
    type:'bar',
    data:{ labels:turnoverYears, datasets:[{
      label:'Nieuwe binnenkomers', data:turnover, backgroundColor:'#c80000', borderRadius:4, maxBarThickness:38
    }]},
    options:{ plugins:{legend:{display:false}}, scales:{ y:{ grid:{color:'#eee6da'} }, x:{grid:{display:false}} } }
  });
}

/* ============ 2. ZOEKEN & VERGELIJK ============ */
let compareList = [];
function renderZoeken(){
  const panel = document.getElementById('panel-zoeken');
  panel.innerHTML = `
    <div class="section-head">
      <span class="kicker">Zoek & vergelijk</span>
      <h2>Zoek & vergelijk</h2>
      <p>Zoek een nummer of artiest op en volg het noteringsverloop door de jaren heen. Voeg tot 6 nummers toe om te vergelijken.</p>
    </div>
    <div class="card">
      <div class="controls">
        <div class="search-box">
          <input type="text" id="searchInput" placeholder="Zoek op artiest of titel…" autocomplete="off">
          <div class="search-results" id="searchResults"></div>
        </div>
      </div>
      <div class="chips" id="chips"></div>
      <canvas id="compareChart" height="110"></canvas>
      <div id="compareEmpty" class="empty-hint">Nog niets geselecteerd — typ hierboven om te zoeken.</div>
    </div>
  `;

  const input = document.getElementById('searchInput');
  const results = document.getElementById('searchResults');

  input.addEventListener('input', ()=>{
    const q = input.value.trim().toLowerCase();
    if(q.length < 2){ results.classList.remove('show'); return; }
    const matches = SONGS.filter(s=> (s.a+' '+s.t).toLowerCase().includes(q)).slice(0,30);
    results.innerHTML = matches.map(s=>{
      const cr = currentRank(s);
      return `<div data-id="${s.id}"><strong>${esc(s.a)}</strong> — ${esc(s.t)}<small>${cr? 'huidig: #'+cr.pos+' ('+cr.year+')' : 'niet in recente lijst'}</small></div>`;
    }).join('') || '<div style="color:#a19c8e;">Geen resultaten</div>';
    results.classList.add('show');
  });
  document.addEventListener('click', (e)=>{
    if(!results.contains(e.target) && e.target!==input) results.classList.remove('show');
  });
  results.addEventListener('click', (e)=>{
    const row = e.target.closest('[data-id]');
    if(!row) return;
    addCompare(parseInt(row.dataset.id));
    input.value=''; results.classList.remove('show');
  });

  renderChips(); renderCompareChart();
}
function addCompare(id){
  const s = SONGS.find(x=>x.id===id);
  if(compareList.includes(id)){
    showToast(`${s.t} staat al in de 'Zoek & Vergelijk' vergelijking.`);
    return;
  }
  if(compareList.length>=6){
    showToast(`${s.t} niet toegevoegd. De 'Zoek & Vergelijk' pagina heeft al het maximaal aantal van zes nummers.`);
    return;
  }
  compareList.push(id);
  renderChips(); renderCompareChart();
  showToast(`${s.t} is toegevoegd aan de 'Zoek & Vergelijk' pagina.`);
}
function removeCompare(id){
  compareList = compareList.filter(x=>x!==id);
  renderChips(); renderCompareChart();
}
function renderChips(){
  const chips = document.getElementById('chips');
  if(!chips) return;
  chips.innerHTML = compareList.map((id,i)=>{
    const s = SONGS.find(x=>x.id===id);
    return `<div class="chip"><span class="swatch" style="background:${PALETTE[i%PALETTE.length]}"></span>${esc(s.a)} — ${esc(s.t)}<button data-id="${id}">✕</button></div>`;
  }).join('');
  chips.querySelectorAll('button').forEach(b=> b.addEventListener('click', ()=> removeCompare(parseInt(b.dataset.id))));
}
let compareChartObj = null;
function renderCompareChart(){
  const canvas = document.getElementById('compareChart');
  const empty = document.getElementById('compareEmpty');
  if(!canvas) return;
  if(compareChartObj){ compareChartObj.destroy(); compareChartObj=null; }
  if(compareList.length===0){ canvas.style.display='none'; empty.style.display='block'; return; }
  canvas.style.display='block'; empty.style.display='none';

  const datasets = compareList.map((id,i)=>{
    const s = SONGS.find(x=>x.id===id);
    const data = YEARS.map(y=>{ const p = posIn(s,y); return p===null? null : p; });
    return { label: `${s.a} — ${s.t}`, data, borderColor:PALETTE[i%PALETTE.length], backgroundColor:PALETTE[i%PALETTE.length],
      spanGaps:false, tension:.25, pointRadius:4, pointHoverRadius:6, borderWidth:2.5 };
  });
  compareChartObj = new Chart(canvas, {
    type:'line',
    data:{ labels:YEARS, datasets },
    options:{
      scales:{ y:{ reverse:true, title:{display:true,text:'Positie (1 = hoogst)'}, grid:{color:'#eee6da'} }, x:{grid:{display:false}} },
      plugins:{ legend:{ position:'bottom', labels:{boxWidth:10, font:{size:11}} },
        tooltip:{ callbacks:{ label:(ctx)=> ctx.dataset.label + ': #' + (ctx.raw ?? '—') } } }
    }
  });
}

/* ============ 3. HALL OF FAME ============ */
function renderHallOfFame(){
  const panel = document.getElementById('panel-halloffame');
  const all14 = SONGS.filter(s=> chartedYearsList(s).length === YEARS.length)
    .sort((a,b)=> (currentRank(a)?.pos ?? 9999) - (currentRank(b)?.pos ?? 9999));

  panel.innerHTML = `
    <div class="section-head">
      <span class="kicker">De legendes</span>
      <h2>Hall of Fame</h2>
      <p>Nummers die zich al ${YEARS.length} jaar op rij weten te handhaven.</p>
    </div>
    <div class="card">
      <h3>Alle ${YEARS.length} jaar genoteerd <span class="tag">${all14.length} nummers</span></h3>
      <div class="table-wrap hof-wrap">
        <table>
          <thead><tr><th>#${CUR_YEAR}</th><th>Artiest</th><th>Titel</th><th>Jaar</th><th>Verloop</th><th></th></tr></thead>
          <tbody>
          ${all14.map(s=>{
            const cr = currentRank(s);
            const spark = YEARS.map(y=> posIn(s,y) ?? '--').join(',');
            return `<tr><td class="rank">${cr?cr.pos:'—'}</td><td class="artist-name">${esc(s.a)}</td><td class="title-name title-narrow">${esc(s.t)}</td><td class="mono">${s.y??'—'}</td><td class="mono verloop-col">${spark}</td>${addBtnHtml(s.id)}</tr>`;
          }).join('') || '<tr><td colspan="6" style="color:#a19c8e;">Geen nummers voldoen (nog) aan dit criterium.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ============ 4. STIJGERS & DALERS ============ */
function renderStijgers(){
  const panel = document.getElementById('panel-stijgers');
  const selectableYears = YEARS.slice(1); // need a previous year
  panel.innerHTML = `
    <div class="section-head">
      <span class="kicker">Op & neer</span>
      <h2>Stijgers & dalers</h2>
      <p>De grootste positieverbeteringen en -verslechteringen ten opzichte van het jaar ervoor.</p>
    </div>
    <div class="controls">
      <label class="mono" style="font-size:12px;color:#8a8578;">JAARGANG</label>
      <select id="yearSelect">${[...selectableYears].reverse().map(y=> `<option value="${y}" ${y===CUR_YEAR?'selected':''}>${y}</option>`).join('')}</select>
    </div>
    <div class="grid-2">
      <div class="card"><h3>Grootste stijgers</h3><div class="table-wrap" id="risersWrap"></div></div>
      <div class="card"><h3>Grootste dalers</h3><div class="table-wrap" id="fallersWrap"></div></div>
    </div>
  `;
  document.getElementById('yearSelect').addEventListener('change', drawStijgers);
  drawStijgers();
}
function drawStijgers(){
  const y = parseInt(document.getElementById('yearSelect').value);
  const prev = y-1;
  const deltas = [];
  SONGS.forEach(s=>{
    const p1 = posIn(s, prev), p2 = posIn(s, y);
    if(p1!==null && p2!==null){ deltas.push({s, p1, p2, delta:p1-p2}); }
  });
  const risers = [...deltas].sort((a,b)=> b.delta-a.delta).slice(0,15);
  const fallers = [...deltas].sort((a,b)=> a.delta-b.delta).slice(0,15);
  function rows(list, dir){
    return list.map(({s,p1,p2,delta})=>{
      const cls = delta>0?'move-up':(delta<0?'move-down':'move-flat');
      const arrow = delta>0? '▲':(delta<0?'▼':'—');
      return `<tr><td class="rank">${p2}</td><td class="artist-name">${esc(s.a)}</td><td class="title-name">${esc(s.t)}</td><td class="mono" style="color:#a19c8e;">was #${p1}</td><td class="${cls}">${arrow} ${Math.abs(delta)}</td>${addBtnHtml(s.id)}</tr>`;
    }).join('') || `<tr><td colspan="6" style="color:#a19c8e;">Geen data voor ${prev}→${y}</td></tr>`;
  }
  document.getElementById('risersWrap').innerHTML = `<table><thead><tr><th>#${y}</th><th>Artiest</th><th>Titel</th><th>${prev}</th><th>Δ</th><th></th></tr></thead><tbody>${rows(risers)}</tbody></table>`;
  document.getElementById('fallersWrap').innerHTML = `<table><thead><tr><th>#${y}</th><th>Artiest</th><th>Titel</th><th>${prev}</th><th>Δ</th><th></th></tr></thead><tbody>${rows(fallers)}</tbody></table>`;
}

/* ============ 5. NIEUWKOMERS ============ */
function renderNieuw(){
  const panel = document.getElementById('panel-nieuw');
  const selectableYears = YEARS.slice(1);

  // global best debuts (precompute once)
  const debuts = [];
  SONGS.forEach(s=>{
    const cy = chartedYearsList(s);
    if(!cy.length) return;
    const firstYear = cy[0];
    if(firstYear === YEARS[0]) return;
    debuts.push({s, year:firstYear, pos: posIn(s,firstYear)});
  });
  const topDebuts = [...debuts].sort((a,b)=> a.pos-b.pos).slice(0,15);

  panel.innerHTML = `
    <div class="section-head">
      <span class="kicker">Vers binnen</span>
      <h2>Nieuwkomers</h2>
      <p>Nummers die voor het eerst in de lijst verschenen — per jaargang, en de beste binnenkomers aller tijden.</p>
    </div>
    <div class="controls">
      <label class="mono" style="font-size:12px;color:#8a8578;">JAARGANG</label>
      <select id="yearSelectNew">${[...selectableYears].reverse().map(y=> `<option value="${y}" ${y===CUR_YEAR?'selected':''}>${y}</option>`).join('')}</select>
    </div>
    <div class="card">
      <h3>Nieuwe binnenkomers <span class="tag" id="newCount"></span></h3>
      <div class="table-wrap" id="newcomersWrap"></div>
    </div>
    <div class="card">
      <h3>Hoogste ooit binnengekomen <span class="tag">top 15, alle jaargangen</span></h3>
      <div class="table-wrap">
        <table><thead><tr><th>Positie</th><th>Artiest</th><th>Titel</th><th>Jaargang</th><th></th></tr></thead>
          <tbody>${topDebuts.map(d=> `<tr><td class="rank">#${d.pos}</td><td class="artist-name">${esc(d.s.a)}</td><td class="title-name">${esc(d.s.t)}</td><td class="mono">${d.year}</td>${addBtnHtml(d.s.id)}</tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
  `;
  document.getElementById('yearSelectNew').addEventListener('change', drawNewcomers);
  drawNewcomers();
}
function drawNewcomers(){
  const y = parseInt(document.getElementById('yearSelectNew').value);
  const newcomers = [];
  SONGS.forEach(s=>{
    const p = posIn(s,y);
    if(p===null) return;
    const earlierCharted = YEARS.filter(yy=> yy<y).some(yy=> isNum(posIn(s,yy)));
    if(!earlierCharted) newcomers.push({s,pos:p});
  });
  newcomers.sort((a,b)=> a.pos-b.pos);
  document.getElementById('newCount').textContent = newcomers.length + ' nieuw in ' + y;
  document.getElementById('newcomersWrap').innerHTML = `
    <table><thead><tr><th>#${y}</th><th>Artiest</th><th>Titel</th><th>Jaar</th><th></th></tr></thead>
      <tbody>${newcomers.slice(0,100).map(({s,pos})=> `<tr><td class="rank">${pos}</td><td class="artist-name">${esc(s.a)}</td><td class="title-name">${esc(s.t)}</td><td class="mono">${s.y??'—'}</td>${addBtnHtml(s.id)}</tr>`).join('') || '<tr><td colspan="5" style="color:#a19c8e;">Geen nieuwkomers gevonden</td></tr>'}</tbody>
    </table>
    ${newcomers.length>100? `<p style="font-size:12px;color:#a19c8e;padding:8px;">+ ${newcomers.length-100} meer (top 100 getoond)</p>`:''}
  `;
}

/* ============ 6. ARTIESTEN ============ */
function renderArtiesten(){
  const panel = document.getElementById('panel-artiesten');
  const byArtist = new Map();
  SONGS.forEach(s=>{
    const key = s.a.trim();
    if(!byArtist.has(key)) byArtist.set(key, {name:key, songs:[], years:new Set()});
    const rec = byArtist.get(key);
    rec.songs.push(s);
    chartedYearsList(s).forEach(y=> rec.years.add(y));
  });
  const artistArr = Array.from(byArtist.values()).map(r=> ({...r, songCount:r.songs.length, yearCount:r.years.size,
    curSongs: r.songs.filter(s=> isNum(posIn(s,CUR_YEAR))).length }));

  panel.innerHTML = `
    <div class="section-head">
      <span class="kicker">Chart-koningen</span>
      <h2>Artiesten</h2>
      <p>Welke artiesten domineren de SNOB 2000 — in aantal nummers en in jaren aanwezigheid.</p>
    </div>
    <div class="card">
      <div class="btnrow" style="margin-bottom:14px;">
        <button class="pill-btn active" data-sort="songCount">Meeste nummers (totaal)</button>
        <button class="pill-btn" data-sort="yearCount">Meeste jaargangen actief</button>
        <button class="pill-btn" data-sort="curSongs">Meeste nummers in ${CUR_YEAR}</button>
      </div>
      <div class="table-wrap" id="artistWrap"></div>
    </div>
  `;
  const btns = panel.querySelectorAll('.pill-btn');
  btns.forEach(b=> b.addEventListener('click', ()=>{
    btns.forEach(x=>x.classList.remove('active')); b.classList.add('active');
    drawArtists(artistArr, b.dataset.sort);
  }));
  drawArtists(artistArr, 'songCount');
}
function drawArtists(arr, sortKey){
  const sorted = [...arr].sort((a,b)=> b[sortKey]-a[sortKey]).slice(0,40);
  const cellStyle = (key)=> key===sortKey ? 'font-weight:700;color:var(--red);' : '';
  document.getElementById('artistWrap').innerHTML = `
    <table><thead><tr><th>#</th><th>Artiest</th><th>Nummers (totaal)</th><th>Jaargangen actief</th><th>In ${CUR_YEAR}</th></tr></thead>
      <tbody>${sorted.map((r,i)=> `<tr><td class="rank">${i+1}</td><td class="artist-name">${esc(r.name)}</td><td class="mono" style="${cellStyle('songCount')}">${r.songCount}</td><td class="mono" style="${cellStyle('yearCount')}">${r.yearCount}</td><td class="mono" style="${cellStyle('curSongs')}">${r.curSongs}</td></tr>`).join('')}</tbody>
    </table>`;
}

/* ============ 7. DECENNIA & JAARTALLEN ============ */
let decadeChartObj = null;
let decadeGranularity = 'decade'; // 'decade' | 'year'
let decadeYearFilter = 'all'; // 'all' or a jaargang (number)
let decadeDrill = null; // e.g. 1990 -> drilled into the years 1990-1999 (decade mode only)
function renderDecennia(){
  const panel = document.getElementById('panel-decennia');
  panel.innerHTML = `
    <div class="section-head">
      <span class="kicker">Muziekgeschiedenis</span>
      <h2>Decennium &amp; jaartallen verdeling</h2>
      <p>Uit welk decennium of jaartal komen de nummers in de SNOB 2000, gebaseerd op releasejaar. Klik op een decennium voor een uitsplitsing naar de jaartallen.</p>
    </div>
    <div class="card">
      <div class="controls">
        <label class="mono" style="font-size:12px;color:#8a8578;">VERDELING PER</label>
        <select id="decadeGranularitySelect">
          <option value="decade">Decennium</option>
          <option value="year">Jaartal</option>
        </select>
        <label class="mono" style="font-size:12px;color:#8a8578;margin-left:14px;">JAARGANG</label>
        <select id="decadeYearSelect">
          <option value="all">Alle jaargangen (${SONGS.length})</option>
          ${[...YEARS].reverse().map(y=> `<option value="${y}">${y}</option>`).join('')}
        </select>
      </div>
      <div id="decadeBreadcrumb"></div>
      <canvas id="decadeChart" height="200"></canvas>
      <p id="unknownNote" style="font-size:12px;color:#a19c8e;margin-top:10px;"></p>
    </div>
  `;
  document.getElementById('decadeGranularitySelect').addEventListener('change', (e)=>{
    decadeGranularity = e.target.value;
    decadeDrill = null;
    drawDecades();
  });
  document.getElementById('decadeYearSelect').addEventListener('change', (e)=>{
    decadeYearFilter = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
    decadeDrill = null;
    drawDecades();
  });
  decadeGranularity = 'decade';
  decadeYearFilter = 'all';
  decadeDrill = null;
  drawDecades();
}
function drawDecades(){
  const pool = decadeYearFilter==='all' ? SONGS : SONGS.filter(s=> isNum(posIn(s,decadeYearFilter)));
  const drillable = decadeGranularity==='decade';
  let unknown = 0;
  let labels, counts;

  if(decadeGranularity==='year'){
    const buckets = new Map();
    pool.forEach(s=>{ if(!s.y){ unknown++; return; } buckets.set(s.y,(buckets.get(s.y)||0)+1); });
    const yrs = Array.from(buckets.keys()).sort((a,b)=>a-b);
    labels = yrs.map(String);
    counts = yrs.map(y=> buckets.get(y));
  } else if(decadeDrill!==null){
    const buckets = new Map();
    pool.forEach(s=>{
      if(!s.y){ unknown++; return; }
      if(Math.floor(s.y/10)*10 !== decadeDrill) return;
      buckets.set(s.y,(buckets.get(s.y)||0)+1);
    });
    const yrs = Array.from(buckets.keys()).sort((a,b)=>a-b);
    labels = yrs.map(String);
    counts = yrs.map(y=> buckets.get(y));
  } else {
    const buckets = new Map();
    pool.forEach(s=>{
      if(!s.y){ unknown++; return; }
      const dec = Math.floor(s.y/10)*10;
      buckets.set(dec,(buckets.get(dec)||0)+1);
    });
    const decades = Array.from(buckets.keys()).sort((a,b)=>a-b);
    labels = decades.map(d=> d+'s');
    counts = decades.map(d=> buckets.get(d));
  }

  document.getElementById('unknownNote').textContent = `${unknown} nummer(s) zonder bekend releasejaar niet meegeteld (${(unknown/pool.length*100).toFixed(0)}% van ${pool.length}).`;

  const breadcrumb = document.getElementById('decadeBreadcrumb');
  if(drillable && decadeDrill!==null){
    breadcrumb.innerHTML = `<button class="pill-btn" id="backToDecades" style="margin-bottom:14px;">← Terug naar decennia (jaren ${decadeDrill}s)</button>`;
    document.getElementById('backToDecades').addEventListener('click', ()=>{ decadeDrill = null; drawDecades(); });
  } else {
    breadcrumb.innerHTML = '';
  }

  if(decadeChartObj) decadeChartObj.destroy();
  decadeChartObj = new Chart(document.getElementById('decadeChart'), {
    type:'bar',
    data:{ labels, datasets:[{ label:'Nummers', data:counts, backgroundColor:'#c80000', borderRadius:4, maxBarThickness:46 }]},
    options:{
      aspectRatio:3,
      plugins:{legend:{display:false}}, scales:{ y:{grid:{color:'#eee6da'}}, x:{grid:{display:false}} },
      onClick:(evt, elements)=>{
        if(!drillable || decadeDrill!==null || !elements.length) return;
        decadeDrill = parseInt(labels[elements[0].index]);
        setTimeout(()=> drawDecades(), 0);
      },
      onHover:(evt, elements)=>{
        evt.native.target.style.cursor = (drillable && decadeDrill===null && elements.length) ? 'pointer' : 'default';
      }
    }
  });
}

/* ============ 8. JAAROVERZICHT ============ */
function renderJaaroverzicht(){
  const panel = document.getElementById('panel-jaaroverzicht');
  panel.innerHTML = `
    <div class="section-head">
      <span class="kicker">Terug in de tijd</span>
      <h2>Jaar-voor-jaar</h2>
      <p>Blader door de volledige lijst van elke jaargang, met vergelijking ten opzichte van het jaar ervoor.</p>
    </div>
    <div class="controls">
      <label class="mono" style="font-size:12px;color:#8a8578;">JAARGANG</label>
      <select id="ySel">${[...YEARS].reverse().map(y=> `<option value="${y}" ${y===CUR_YEAR?'selected':''}>${y}</option>`).join('')}</select>
      <label class="mono" style="font-size:12px;color:#8a8578;margin-left:14px;">TOON</label>
      <select id="nSel">
        <option value="10" selected>Top 10</option>
        <option value="25">Top 25</option>
        <option value="50">Top 50</option>
        <option value="100">Top 100</option>
        <option value="2000">Volledig</option>
      </select>
    </div>
    <div class="card">
      <div class="table-wrap" id="yearWrap"></div>
    </div>
  `;
  document.getElementById('ySel').addEventListener('change', drawYearOverview);
  document.getElementById('nSel').addEventListener('change', drawYearOverview);
  drawYearOverview();
}
function drawYearOverview(){
  const y = parseInt(document.getElementById('ySel').value);
  const n = parseInt(document.getElementById('nSel').value);
  const hasPrev = YEARS.includes(y-1);
  const ranked = SONGS.filter(s=> isNum(posIn(s,y))).sort((a,b)=> posIn(a,y)-posIn(b,y)).slice(0,n);
  document.getElementById('yearWrap').innerHTML = `
    <table><thead><tr><th>#${y}</th><th>Artiest</th><th>Titel</th><th>Jaar</th><th>${hasPrev? y-1 : ''}</th><th></th></tr></thead>
      <tbody>${ranked.map(s=>{
        const pos = posIn(s,y);
        let moveHtml = '';
        if(hasPrev){
          const prevPos = posIn(s,y-1);
          const prevCode = codeIn(s,y-1);
          if(prevPos!==null){
            const d = prevPos-pos;
            const cls = d>0?'move-up':(d<0?'move-down':'move-flat');
            const arrow = d>0?'▲':(d<0?'▼':'—');
            moveHtml = `<span class="${cls}">${arrow} ${Math.abs(d)}</span> <span class="mono" style="color:#a19c8e;">(was #${prevPos})</span>`;
          } else if(prevCode==='T'){ moveHtml = `<span class="move-new" title="Verwijderd wegens Top 2000">EX-T</span>`; }
          else if(prevCode==='K'){ moveHtml = `<span class="move-new" title="Stond dat jaar in de Keuzelijst voor de Top 2000">KEUZELIJST</span>`; }
          else { moveHtml = `<span class="move-new">NIEUW</span>`; }
        }
        return `<tr><td class="rank">${pos}</td><td class="artist-name">${esc(s.a)}</td><td class="title-name">${esc(s.t)}</td><td class="mono">${s.y??'—'}</td><td>${moveHtml}</td>${addBtnHtml(s.id)}</tr>`;
      }).join('')}</tbody>
    </table>`;
}

/* ============ INIT ============ */
const RENDERERS = {
  overzicht: renderOverzicht,
  zoeken: renderZoeken,
  halloffame: renderHallOfFame,
  stijgers: renderStijgers,
  nieuw: renderNieuw,
  artiesten: renderArtiesten,
  decennia: renderDecennia,
  jaaroverzicht: renderJaaroverzicht,
};
activate('overzicht');

