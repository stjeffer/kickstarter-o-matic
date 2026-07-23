// Launcher screen — searchable gallery of canvas types and templates
import { state, save } from './state.js';
import { $ } from './utils.js';
import { renderAll } from './render.js';
import { applyTemplate, loadSessionFromSchema } from './session.js';

const LS_PREVIEWS = {
  whiteboard: `<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="125" fill="#fbfaff"/>
    <g fill="#fff5c2" stroke="#f2e58a" stroke-width=".5"><rect x="24" y="22" width="36" height="30" rx="3"/><rect x="80" y="34" width="36" height="30" rx="3" transform="rotate(-3 98 49)"/><rect x="130" y="20" width="36" height="30" rx="3" transform="rotate(4 148 35)"/></g>
    <g fill="#d7f0ff" stroke="#a9d7ee" stroke-width=".5"><rect x="40" y="70" width="36" height="30" rx="3"/><rect x="96" y="76" width="36" height="30" rx="3"/></g>
    <rect x="145" y="70" width="36" height="30" rx="3" fill="#ffd9e6" stroke="#f0aac2" stroke-width=".5"/>
    </svg>`,
  matrix2x2: `<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="125" fill="#f8f7ff"/>
    <line x1="100" y1="10" x2="100" y2="115" stroke="#c8bfe6" stroke-width="1.2"/>
    <line x1="10" y1="62" x2="190" y2="62" stroke="#c8bfe6" stroke-width="1.2"/>
    <circle cx="55" cy="35" r="6" fill="#c9b8ff"/><circle cx="150" cy="30" r="7" fill="#a58cff"/>
    <circle cx="60" cy="90" r="5" fill="#ffc9df"/><circle cx="140" cy="88" r="8" fill="#7a5dff"/>
    </svg>`,
  raci: `<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="125" fill="#f6f9ff"/>
    <g stroke="#c8d5ee" stroke-width=".6" fill="none"><line x1="60" y1="10" x2="60" y2="115"/><line x1="95" y1="10" x2="95" y2="115"/><line x1="130" y1="10" x2="130" y2="115"/><line x1="165" y1="10" x2="165" y2="115"/></g>
    <rect x="10" y="18" width="180" height="14" fill="#e6ecff"/>
    <g font-family="Segoe UI" font-size="8" font-weight="600" fill="#5b5187"><text x="72" y="28">R</text><text x="107" y="28">A</text><text x="142" y="28">C</text><text x="177" y="28">I</text></g>
    <g fill="#a58cff"><circle cx="77" cy="55" r="3"/><circle cx="112" cy="55" r="3"/><circle cx="77" cy="80" r="3"/><circle cx="147" cy="80" r="3"/><circle cx="182" cy="105" r="3"/></g>
    </svg>`,
  hswimlanes: `<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="125" fill="#f5fbf7"/>
    <rect x="0" y="12" width="200" height="30" fill="#e0f5e6"/><rect x="0" y="47" width="200" height="30" fill="#eef6ff"/><rect x="0" y="82" width="200" height="30" fill="#fef4e6"/>
    <g fill="#fff5c2" stroke="#e5d476" stroke-width=".5"><rect x="20" y="20" width="26" height="14" rx="2"/><rect x="60" y="55" width="26" height="14" rx="2"/><rect x="100" y="20" width="26" height="14" rx="2"/><rect x="140" y="90" width="26" height="14" rx="2"/></g>
    <path d="M46 27 L60 62 L86 62 L100 27 L126 27 L140 97" stroke="#7a5dff" stroke-width="1" fill="none" stroke-dasharray="2 2"/>
    </svg>`,
  vswimlanes: `<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="125" fill="#fdfaf5"/>
    <rect x="12" y="10" width="42" height="105" fill="#ffefd6"/><rect x="60" y="10" width="42" height="105" fill="#fef1e6"/><rect x="108" y="10" width="42" height="105" fill="#f4eaff"/><rect x="156" y="10" width="42" height="105" fill="#e6f5ff"/>
    <g fill="#fff5c2" stroke="#e5d476" stroke-width=".5"><rect x="20" y="25" width="26" height="14" rx="2"/><rect x="68" y="55" width="26" height="14" rx="2"/><rect x="116" y="35" width="26" height="14" rx="2"/><rect x="164" y="80" width="26" height="14" rx="2"/></g>
    </svg>`,
  journey: `<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="125" fill="#fdf7fa"/>
    <g stroke="#e6d1de" stroke-width=".6"><line x1="30" y1="10" x2="30" y2="115"/><line x1="70" y1="10" x2="70" y2="115"/><line x1="110" y1="10" x2="110" y2="115"/><line x1="150" y1="10" x2="150" y2="115"/></g>
    <path d="M15 90 Q 45 40 85 60 T 155 45 Q 180 55 190 30" stroke="#ff6b9e" stroke-width="1.4" fill="none"/>
    <g font-size="9"><text x="14" y="24">😐</text><text x="54" y="24">🙂</text><text x="94" y="24">😊</text><text x="134" y="24">😍</text><text x="174" y="24">🤩</text></g>
    </svg>`,
  empathy: `<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="125" fill="#fbf9f4"/>
    <line x1="100" y1="10" x2="100" y2="115" stroke="#d9d0b6"/><line x1="10" y1="62" x2="190" y2="62" stroke="#d9d0b6"/>
    <circle cx="100" cy="62" r="14" fill="#ffe9b3" stroke="#e5c778"/>
    <g font-family="Segoe UI" font-size="8" fill="#7a6a3c" font-weight="600"><text x="40" y="35">Says</text><text x="132" y="35">Thinks</text><text x="45" y="95">Does</text><text x="132" y="95">Feels</text></g>
    </svg>`,
  mindmap: `<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="125" fill="#f6f9ff"/>
    <circle cx="100" cy="62" r="42" fill="none" stroke="#c8bfe6" stroke-width=".6" stroke-dasharray="2 2"/>
    <line x1="100" y1="62" x2="45" y2="30" stroke="#a58cff"/><line x1="100" y1="62" x2="160" y2="28" stroke="#a58cff"/><line x1="100" y1="62" x2="35" y2="95" stroke="#a58cff"/><line x1="100" y1="62" x2="165" y2="98" stroke="#a58cff"/>
    <circle cx="100" cy="62" r="14" fill="#7a5dff"/>
    <g fill="#fff" stroke="#a58cff"><circle cx="45" cy="30" r="6"/><circle cx="160" cy="28" r="6"/><circle cx="35" cy="95" r="6"/><circle cx="165" cy="98" r="6"/></g>
    </svg>`,
  strategy: `<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="125" fill="#fbfaff"/>
    <rect x="10" y="10" width="180" height="26" fill="#e8e2ff"/>
    <text x="16" y="27" font-family="Segoe UI" font-size="8" font-weight="600" fill="#5b4a99">Vision</text>
    <g><rect x="10" y="42" width="58" height="70" fill="#f0eaff" stroke="#c8bfe6"/><rect x="72" y="42" width="58" height="70" fill="#f5f0ff" stroke="#c8bfe6"/><rect x="134" y="42" width="56" height="70" fill="#faf6ff" stroke="#c8bfe6"/></g>
    <g font-family="Segoe UI" font-size="6.5" fill="#8b7fb8"><text x="14" y="52">Now</text><text x="76" y="52">Next</text><text x="138" y="52">Later</text></g>
    <g fill="#a58cff"><rect x="14" y="60" width="50" height="8" rx="1.5"/><rect x="76" y="60" width="50" height="8" rx="1.5"/><rect x="138" y="60" width="48" height="8" rx="1.5"/></g>
    </svg>`,
  backcast: `<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bcg" x1="0" x2="1"><stop offset="0" stop-color="#e6f5ff"/><stop offset="1" stop-color="#ffe4f0"/></linearGradient><marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#c785d9"/></marker></defs>
    <rect width="200" height="125" fill="url(#bcg)"/>
    <g stroke="#d9c9dc" stroke-width=".5"><line x1="45" y1="10" x2="45" y2="115"/><line x1="85" y1="10" x2="85" y2="115"/><line x1="125" y1="10" x2="125" y2="115"/><line x1="160" y1="10" x2="160" y2="115"/></g>
    <path d="M180 62 L18 62" stroke="#c785d9" stroke-width="1.2" marker-end="url(#ah)"/>
    <g fill="#fff5c2" stroke="#e5d476" stroke-width=".5"><rect x="165" y="40" width="26" height="14" rx="2"/><rect x="130" y="65" width="26" height="14" rx="2"/><rect x="90" y="40" width="26" height="14" rx="2"/><rect x="50" y="80" width="26" height="14" rx="2"/><rect x="15" y="40" width="26" height="14" rx="2"/></g>
    </svg>`,
  usecase: `<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="125" fill="#fffaf3"/>
    <g stroke="#f0dcbf" stroke-width=".6"><line x1="40" y1="10" x2="40" y2="115"/><line x1="80" y1="10" x2="80" y2="115"/><line x1="120" y1="10" x2="120" y2="115"/><line x1="160" y1="10" x2="160" y2="115"/></g>
    <g fill="#ffe9b3" stroke="#e5c778" stroke-width=".5"><rect x="8" y="30" width="28" height="14" rx="2"/><rect x="48" y="55" width="28" height="14" rx="2"/><rect x="88" y="30" width="28" height="14" rx="2"/><rect x="128" y="75" width="28" height="14" rx="2"/><rect x="168" y="45" width="28" height="14" rx="2"/></g>
    <g font-family="Segoe UI" font-size="6" fill="#8b7358"><text x="10" y="22">Trigger</text><text x="50" y="22">JTBD</text><text x="90" y="22">Idea</text><text x="130" y="22">Value</text><text x="170" y="22">Risk</text></g>
    </svg>`,
};

function previewFor(key, ct){ return LS_PREVIEWS[ct] || LS_PREVIEWS[key] || LS_PREVIEWS.whiteboard; }

const LS_MODES = [
  // Templates
  {key:'frontier',   cat:'templates', kind:'template', title:'Frontier Action Plan', desc:'5-stage arc — future, cluster, objectives, initiatives, plan.', badge:'Multi-stage', badgeKind:'multi', ct:'backcast'},
  {key:'backcast',   cat:'templates', kind:'template', title:'Future-State Backcast', desc:'Right-to-left "what had to be true" for responsible AI.', ct:'backcast'},
  {key:'sample',     cat:'templates', kind:'template', title:'Discovery Sample', desc:'A populated example showcasing the full canvas.', ct:'whiteboard'},
  {key:'ideation',   cat:'templates', kind:'template', title:'Ideation / Brainstorm', desc:'Diverge fast with colour-coded stickies.', ct:'whiteboard'},
  {key:'empathy',    cat:'templates', kind:'template', title:'Empathy Map', desc:'Says / thinks / does / feels — pre-laid.', ct:'empathy'},
  {key:'experience', cat:'templates', kind:'template', title:'Experience Mapping', desc:'Journey stages with emotions along the way.', ct:'journey'},
  {key:'retro',      cat:'templates', kind:'template', title:'Retrospective', desc:'Went well · didn\'t · actions — seeded lanes.', ct:'whiteboard'},
  {key:'process',    cat:'templates', kind:'template', title:'Process Mapping', desc:'Swimlanes, decisions, delays and handoffs.', ct:'hswimlanes'},
  // Canvas types
  {key:'__blank',       cat:'canvases', kind:'canvas', title:'Blank canvas', desc:'Freestyle — start with an empty page.', ct:'whiteboard', blank:true},
  {key:'ct:matrix2x2',  cat:'canvases', kind:'canvas', title:'2×2 Matrix', desc:'Prioritise on impact vs. effort.', ct:'matrix2x2', blank:true},
  {key:'ct:raci',       cat:'canvases', kind:'canvas', title:'RACI Matrix', desc:'Responsible, accountable, consulted, informed.', ct:'raci', blank:true},
  {key:'ct:strategy',   cat:'canvases', kind:'canvas', title:'Strategy on a Page', desc:'Vision + Now / Next / Later horizons.', ct:'strategy', blank:true},
  {key:'ct:hswimlanes', cat:'canvases', kind:'canvas', title:'Horizontal Swimlanes', desc:'Blank horizontal lanes by role or system.', ct:'hswimlanes', blank:true},
  {key:'ct:vswimlanes', cat:'canvases', kind:'canvas', title:'Vertical Swimlanes', desc:'Blank vertical columns for phased work.', ct:'vswimlanes', blank:true},
  {key:'ct:journey',    cat:'canvases', kind:'canvas', title:'Journey Map', desc:'Stages with a customer emotion line.', ct:'journey', blank:true},
  {key:'ct:mindmap',    cat:'canvases', kind:'canvas', title:'Mind Map', desc:'Radial exploration around a central idea.', ct:'mindmap', blank:true},
  {key:'ct:usecase',    cat:'canvases', kind:'canvas', title:'Use Case Ideation', desc:'Trigger · JTBD · Idea · Value · Risk.', ct:'usecase', blank:true},
];

const LS_FEATURED_KEYS = ['frontier','backcast','ideation','process','ct:matrix2x2','__blank'];
const LS_CATS = [
  {key:'featured', label:'Featured'},
  {key:'templates', label:'Templates'},
  {key:'canvases', label:'Canvas types'},
  {key:'all', label:'All'},
];

const LS_SAMPLE_JSON = {
  title:'Discovery with BBC', customer:'BBC', sessionType:'Strategy Discovery',
  description:'Frontier action plan for responsible AI in newsroom workflows.',
  stages:[
    {name:'Future state', canvasType:'backcast', activityType:'backcast',
     groupings:[{name:'Future Outcome', color:'#af52de'},{name:'What Had To Be True', color:'#0a84ff'},{name:'Signals', color:'#34c759'}],
     activities:[{type:'prompt', category:'Future Outcome', text:'What does success look like in 3 years?'}]},
    {name:'Cluster', canvasType:'cluster'},
    {name:'Objectives', canvasType:'objectives'},
    {name:'Initiatives', canvasType:'initiatives'},
    {name:'Plan', canvasType:'plan'}
  ]
};

export function openLauncher(){
  $('#launchScreen').classList.add('open');
  $('#launchScreen').setAttribute('aria-hidden','false');
}

export function closeLauncher(){
  $('#launchScreen').classList.remove('open');
  $('#launchScreen').setAttribute('aria-hidden','true');
}

export function initLauncher(){
  const scr = $('#launchScreen');
  if(!scr) return;
  const grid = $('#lsGrid');
  const tabsEl = $('#lsTabs');
  const sectionTitle = $('#lsSectionTitle');
  const countEl = $('#lsCount');
  const searchEl = $('#lsSearch');
  const importBox = $('#lsImport');
  const importToggle = $('#lsImportToggle');
  let currentCat = 'featured';
  let lsSelected = null;
  const launchBtn = $('#lsLaunch');

  tabsEl.innerHTML = LS_CATS.map(c=>`<button class="ls-tab ${c.key===currentCat?'active':''}" data-cat="${c.key}" type="button">${c.label}</button>`).join('');
  tabsEl.querySelectorAll('.ls-tab').forEach(b=>b.addEventListener('click', ()=>{
    tabsEl.querySelectorAll('.ls-tab').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    currentCat = b.dataset.cat;
    sectionTitle.textContent = LS_CATS.find(c=>c.key===currentCat).label;
    renderGrid();
  }));
  sectionTitle.textContent = LS_CATS.find(c=>c.key===currentCat).label;

  function updateLaunchBtn(){
    const raw = ($('#lsImportText')?.value||'').trim();
    const hasJson = raw.length > 0;
    if(!lsSelected && !hasJson){
      launchBtn.disabled = true; launchBtn.textContent = 'Select a canvas →'; return;
    }
    launchBtn.disabled = false;
    if(lsSelected && hasJson) launchBtn.textContent = 'Import & launch →';
    else if(hasJson) launchBtn.textContent = 'Import JSON & launch →';
    else launchBtn.textContent = 'Launch →';
  }

  function renderGrid(){
    const q = (searchEl.value||'').trim().toLowerCase();
    const list = LS_MODES.filter(m=>{
      if(currentCat==='featured' && !LS_FEATURED_KEYS.includes(m.key)) return false;
      if(currentCat!=='featured' && currentCat!=='all' && m.cat!==currentCat) return false;
      if(q && !(m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q))) return false;
      return true;
    });
    countEl.textContent = `${list.length} option${list.length===1?'':'s'}`;
    grid.innerHTML = list.map(m=>{
      const kindBadge = m.kind==='template'
        ? `<span class="badge template">Template</span>`
        : `<span class="badge canvas">Canvas type</span>`;
      const extra = m.badge ? `<span class="badge ${m.badgeKind||''}">${m.badge}</span>` : '';
      return `
      <button class="ls-card ${m.key===lsSelected?'selected':''}" data-key="${m.key}" type="button">
        <span class="preview">${previewFor(m.key, m.ct)}</span>
        <span class="meta">
          <span class="kind-row">${kindBadge}${extra}</span>
          <h4>${m.title}</h4>
          <p>${m.desc}</p>
        </span>
      </button>`;
    }).join('');
    grid.querySelectorAll('.ls-card').forEach(b=>{
      b.addEventListener('click', ()=>{
        grid.querySelectorAll('.ls-card').forEach(x=>x.classList.remove('selected'));
        b.classList.add('selected');
        lsSelected = b.dataset.key;
        const mode = LS_MODES.find(m=>m.key===lsSelected);
        $('#lsPickedHint').innerHTML = `Selected: <strong>${mode.title}</strong>`;
        updateLaunchBtn();
      });
    });
  }
  searchEl.addEventListener('input', renderGrid);
  renderGrid();

  function openImport(){ importBox.classList.add('open'); }
  importToggle.addEventListener('click', ()=>{
    importBox.classList.toggle('open');
    if(importBox.classList.contains('open')) $('#lsImportText').focus();
  });
  const importTa = $('#lsImportText');
  function validateJson(){
    const raw = importTa.value.trim();
    const errEl = $('#lsImportErr');
    if(!raw){ errEl.textContent=''; updateLaunchBtn(); return; }
    try{ JSON.parse(raw); errEl.textContent=''; errEl.style.color=''; }
    catch(e){ errEl.style.color='#c0392b'; errEl.textContent='Invalid JSON: '+e.message; }
    updateLaunchBtn();
  }
  importTa.addEventListener('input', validateJson);
  importTa.addEventListener('paste', ()=>{ setTimeout(validateJson, 0); });

  // Route paste from anywhere on the launcher into the JSON box when it looks like JSON
  scr.addEventListener('paste', (e)=>{
    if(document.activeElement === importTa) return;
    const text = (e.clipboardData||window.clipboardData)?.getData('text');
    if(!text) return;
    const trimmed = text.trim();
    if(!(trimmed.startsWith('{') || trimmed.startsWith('['))) return;
    e.preventDefault();
    openImport();
    importTa.value = text;
    importTa.focus();
    validateJson();
  });

  $('#lsSkip').addEventListener('click', ()=>{
    state.session=null; state.canvasType='whiteboard';
    state.lanes=[]; state.prompts=[]; state.cards=[]; state.connections=[];
    $('#canvasType').value=state.canvasType; renderAll(); save();
    closeLauncher();
  });

  $('#lsPasteSample').addEventListener('click', ()=>{
    openImport();
    importTa.value = JSON.stringify(LS_SAMPLE_JSON, null, 2);
    validateJson();
  });

  launchBtn.addEventListener('click', ()=>{
    const err = $('#lsImportErr'); err.style.color=''; err.textContent='';
    const raw = importTa.value.trim();
    let data = null;
    if(raw){
      try{ data = JSON.parse(raw); }
      catch(e){ err.style.color='#c0392b'; err.textContent='Invalid JSON: '+e.message; openImport(); return; }
    }
    if(!lsSelected && !data){ err.textContent='Pick a canvas or paste a session JSON.'; return; }
    if(lsSelected){
      const mode = LS_MODES.find(m=>m.key===lsSelected);
      if(mode.blank){
        state.session=null; state.canvasType = mode.ct || 'whiteboard';
        state.lanes=[]; state.prompts=[]; state.cards=[]; state.connections=[];
        state.view={x:40,y:40,scale:1};
      } else {
        applyTemplate(mode.key);
      }
    } else {
      state.session=null; state.canvasType='whiteboard';
      state.lanes=[]; state.prompts=[]; state.cards=[]; state.connections=[];
      state.view={x:40,y:40,scale:1};
    }
    if(data){
      try{
        if(Array.isArray(data.stages)) loadSessionFromSchema(data);
        else{
          state.session=null;
          if(data.canvasType) state.canvasType=data.canvasType;
          if(Array.isArray(data.lanes)) state.lanes=data.lanes;
          if(Array.isArray(data.prompts)) state.prompts=data.prompts;
          if(Array.isArray(data.cards)) state.cards=data.cards;
          if(Array.isArray(data.connections)) state.connections=data.connections;
        }
      }catch(e){ err.style.color='#c0392b'; err.textContent='Could not load session: '+e.message; openImport(); return; }
    }
    $('#canvasType').value = state.canvasType;
    renderAll(); save();
    closeLauncher();
  });

  $('#btnHome')?.addEventListener('click', openLauncher);
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape' && scr.classList.contains('open')) closeLauncher();
  });
}
