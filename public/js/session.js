// Session management: multi-stage discovery, workflow rail, stage bar
import { state, save } from './state.js';
import { LANE_COLORS, CANVAS_META, ACTIVITY_TYPE_CANVAS } from './constants.js';
import { $, escapeHtml, uid } from './utils.js';
import {
  renderAll, renderPalette, renderLanes, renderPrompts, renderCards,
  applyView, applyCanvasTheme, renderLanesLayer, clearSelection, addCard,
  clientToWorld,
} from './render.js';
import { TEMPLATE_PACKS } from './templates.js';

// ============ Canvas type aliases ============
const CANVAS_TYPE_ALIASES = {
  'freestyle':'whiteboard','free':'whiteboard','blank':'whiteboard',
  'swimlanes':'hswimlanes','swimlane':'hswimlanes','process':'hswimlanes','process-mapping':'hswimlanes',
  'swimlanes-h':'hswimlanes', 'swimlanes-v':'vswimlanes',
  'horizontal-swimlanes':'hswimlanes', 'vertical-swimlanes':'vswimlanes',
  'matrix':'matrix2x2', '2x2':'matrix2x2',
  'raci-matrix':'raci',
  'strategy-on-a-page':'strategy','strategy_page':'strategy','sop':'strategy',
  'mind-map':'mindmap','mind_map':'mindmap','mindmapping':'mindmap',
  'back-cast':'backcast','backcasting':'backcast','future-back':'backcast','futureback':'backcast',
  'future-state':'backcast','future-state-back':'backcast','pre-mortem':'backcast','premortem':'backcast',
  'reverse-planning':'backcast','working-backwards':'backcast',
  'use-case':'usecase','usecase':'usecase','use-cases':'usecase','use-case-ideation':'usecase',
  'usecase-ideation':'usecase','ideation-usecase':'usecase','ai-use-case':'usecase','opportunity':'usecase',
};

function normalizeCanvasType(t){
  if(!t) return 'whiteboard';
  const k = String(t).toLowerCase();
  return CANVAS_TYPE_ALIASES[k] || k;
}

// ============ Load / persist stages ============
export function loadSessionFromSchema(data){
  const stages = data.stages.map((s, i)=>{
    const canvasType = normalizeCanvasType(s.canvasType);
    const lanes = (s.groupings||[]).map((name, li)=>({
      id:'l-'+i+'-'+li, name, color: LANE_COLORS[li % LANE_COLORS.length],
    }));
    const prompts = (s.activities||[]).map(a=>({
      category: [a.activityType, a.timebox].filter(Boolean).join(' · '),
      text: a.title || a.prompt || 'Untitled',
      activity: a,
      stageCanvasType: canvasType,
    }));
    return {
      name: s.name || ('Stage '+(i+1)),
      description: s.description || '',
      canvasType, lanes, prompts,
      cards: [], connections: [],
      view: { x:40, y:40, scale:1 },
    };
  });
  state.session = {
    title: data.title || 'Discovery Session',
    customer: data.customer || '',
    date: data.date || '',
    sessionType: data.sessionType || data.type || '',
    description: data.description || '',
    stages,
    activeIndex: 0,
  };
  loadStage(0);
}

export function persistCurrentStage(){
  if(!state.session) return;
  const st = state.session.stages[state.session.activeIndex];
  if(!st) return;
  st.canvasType = state.canvasType;
  st.lanes = state.lanes;
  st.prompts = state.prompts;
  st.cards = state.cards;
  st.connections = state.connections;
  st.view = state.view;
}

function loadStage(idx){
  if(!state.session) return;
  const st = state.session.stages[idx];
  if(!st) return;
  state.session.activeIndex = idx;
  state.canvasType = st.canvasType;
  state.lanes = st.lanes;
  state.prompts = st.prompts;
  state.cards = st.cards;
  state.connections = st.connections;
  state.view = st.view || {x:40,y:40,scale:1};
  state.selection = { cardId:null, connId:null };
  $('#canvasType').value = state.canvasType;
  renderAll(); save();
}

function switchStage(idx){
  if(!state.session || idx===state.session.activeIndex) return;
  persistCurrentStage();
  loadStage(idx);
}

function ensureSession(){
  if(state.session) return;
  persistCurrentStage();
  state.session = {
    title:'', customer:'', date:'', sessionType:'', description:'',
    stages: [{
      name:'Canvas 1', description:'',
      canvasType: state.canvasType,
      lanes: state.lanes, prompts: state.prompts,
      cards: state.cards, connections: state.connections,
      view: state.view,
    }],
    activeIndex: 0,
  };
}

function addBlankCanvas(canvasType){
  ensureSession();
  persistCurrentStage();
  const s = state.session;
  s.stages.push({
    name:'Canvas ' + (s.stages.length + 1),
    description:'',
    canvasType: canvasType || 'whiteboard',
    lanes: [], prompts: [], cards: [], connections: [],
    view: {x:40, y:40, scale:1},
  });
  s.activeIndex = -1;
  loadStage(s.stages.length - 1);
}

function closeStage(idx){
  if(!state.session) return;
  const s = state.session;
  if(!s.stages[idx]) return;
  if(s.stages.length <= 1){
    if(!confirm('This is the only canvas. Clear it?')) return;
    s.stages[idx] = { name:'Canvas 1', description:'', canvasType:'whiteboard',
      lanes:[], prompts:[], cards:[], connections:[], view:{x:40,y:40,scale:1} };
    s.activeIndex = -1;
    loadStage(0); return;
  }
  if(!confirm(`Close "${s.stages[idx].name}"? Its contents will be lost.`)) return;
  s.stages.splice(idx, 1);
  let next = s.activeIndex;
  if(idx < s.activeIndex) next = s.activeIndex - 1;
  else if(idx === s.activeIndex) next = Math.min(idx, s.stages.length - 1);
  s.activeIndex = -1;
  loadStage(Math.max(0,next));
}

function renameStage(idx){
  if(!state.session) return;
  const st = state.session.stages[idx]; if(!st) return;
  const name = prompt('Rename canvas', st.name || '');
  if(name==null) return;
  st.name = name.trim().slice(0,60) || st.name;
  renderStageBar(); save();
}

// ============ Workflow rail ============
const WORKFLOW_STAGES = [
  {kind:'future',      short:'1. Future',      label:'Envision the future state'},
  {kind:'cluster',     short:'2. Cluster',     label:'Group related ideas'},
  {kind:'objectives',  short:'3. Objectives',  label:'Form objectives from groups'},
  {kind:'initiatives', short:'4. Initiatives', label:'Define initiatives per objective'},
  {kind:'plan',        short:'5. Plan',        label:'Sequence on a page'},
];

function renderWorkflowRail(){
  const rail = $('#workflowRail');
  if(!rail) return;
  const stages = state.session?.stages || [];
  const hasWorkflow = stages.some(t=>t.stageKind);
  if(!hasWorkflow){ rail.style.display='none'; rail.innerHTML=''; return; }
  rail.style.display = 'flex';
  const activeIdx = state.session.activeIndex;
  const activeKind = stages[activeIdx]?.stageKind;

  const parts = [`<span class="wr-label">Frontier action plan</span>`];
  WORKFLOW_STAGES.forEach((st, i)=>{
    const idx = stages.findIndex(t=>t.stageKind===st.kind);
    if(idx<0) return;
    const cls = 'wr-step' + (activeKind===st.kind?' active':'');
    parts.push(`<button class="${cls}" data-goto-idx="${idx}" title="${escapeHtml(st.label)}"><span class="wr-num">${i+1}</span>${escapeHtml(st.short.replace(/^\d+\.\s*/,''))}</button>`);
    if(i<WORKFLOW_STAGES.length-1) parts.push(`<span class="wr-arrow">→</span>`);
  });
  const nextIdx = WORKFLOW_STAGES.findIndex(s=>s.kind===activeKind);
  const nextStage = nextIdx>=0 ? WORKFLOW_STAGES[nextIdx+1] : null;
  const nextStageIdx = nextStage ? stages.findIndex(t=>t.stageKind===nextStage.kind) : -1;
  const btnLabel = nextStageIdx>=0 ? `Send forward → ${nextStage.short.replace(/^\d+\.\s*/,'')}` : (activeKind?'End of flow':'');
  parts.push(`<button class="wr-forward" data-send-forward ${nextStageIdx>=0?'':'disabled'}>${escapeHtml(btnLabel)}</button>`);
  parts.push(`<button class="wr-close" data-wr-close title="Hide workflow rail" aria-label="Hide">×</button>`);
  rail.innerHTML = parts.join('');

  rail.querySelectorAll('[data-goto-idx]').forEach(b=>{
    b.addEventListener('click', ()=>{ switchStage(parseInt(b.dataset.gotoIdx,10)); });
  });
  const fwd = rail.querySelector('[data-send-forward]');
  if(fwd && nextStageIdx>=0){
    fwd.addEventListener('click', ()=> sendForward(activeKind, nextStage.kind));
  }
  const closeBtn = rail.querySelector('[data-wr-close]');
  if(closeBtn) closeBtn.addEventListener('click', ()=>{ rail.style.display='none'; });
}

function sendForward(fromKind, toKind){
  if(!state.session) return;
  persistCurrentStage();
  const stages = state.session.stages;
  const fromIdx = stages.findIndex(t=>t.stageKind===fromKind);
  const toIdx   = stages.findIndex(t=>t.stageKind===toKind);
  if(fromIdx<0 || toIdx<0) return;
  const fromTab = stages[fromIdx];
  const toTab   = stages[toIdx];

  if(fromKind==='cluster' && toKind==='objectives'){
    const groups = (fromTab.cards||[]).filter(c=>c.type==='group');
    const seeds = groups.map((g,i)=>{
      const members = (fromTab.cards||[]).filter(c=>c.groupId===g.id && c.type!=='group');
      const summary = members.slice(0,4).map(m=> (m.text||'').replace(/\s+/g,' ').slice(0,60)).filter(Boolean).join(' · ');
      return {
        id: uid(), type:'objective',
        x: 80 + (i%3)*340, y: 160 + Math.floor(i/3)*220,
        text: g.text || ('Objective '+(i+1)),
        why: summary || 'Derived from clustered ideas',
        measure: 'TBD — define a success measure',
      };
    });
    if(!seeds.length){ alert('No group frames with members yet. Drop stickies into a Group frame on the Cluster canvas first.'); return; }
    toTab.cards = (toTab.cards||[]).concat(seeds);
    switchStage(toIdx); return;
  }
  if(fromKind==='objectives' && toKind==='initiatives'){
    const objectives = (fromTab.cards||[]).filter(c=>c.type==='objective');
    if(!objectives.length){ alert('No objectives to send forward.'); return; }
    const rows = objectives.map((o,i)=>({
      id: uid(), type:'objective',
      x: 60, y: 120 + i*220,
      text: o.text, why:o.why, measure:o.measure, promoted:true,
    }));
    const inis = objectives.map((o,i)=>({
      id: uid(), type:'initiative',
      x: 420, y: 120 + i*220,
      text: 'Initiative for: '+ (o.text||''),
      hypothesis:'We believe … so that …',
      owner:'', effort:'M', impact:3, horizon:'now',
      objectiveId: o.id,
    }));
    toTab.cards = (toTab.cards||[]).concat(rows, inis);
    switchStage(toIdx); return;
  }
  if(fromKind==='initiatives' && toKind==='plan'){
    const inis = (fromTab.cards||[]).filter(c=>c.type==='initiative');
    if(!inis.length){ alert('No initiatives to send forward.'); return; }
    const colW = 540;
    const byHorizon = {now:0, next:1, later:2};
    const counters = {now:0, next:0, later:0};
    const seeds = inis.map(i=>{
      const h = ['now','next','later'].includes(i.horizon) ? i.horizon : 'now';
      const col = byHorizon[h];
      const row = counters[h]++;
      return {
        id: uid(), type:'initiative',
        x: 60 + col*colW, y: 180 + row*160,
        text:i.text, hypothesis:i.hypothesis, owner:i.owner,
        effort:i.effort, impact:i.impact, horizon:h,
      };
    });
    toTab.cards = (toTab.cards||[]).concat(seeds);
    switchStage(toIdx); return;
  }
  switchStage(toIdx);
}

// ============ Stage bar ============
export function renderStageBar(){
  renderWorkflowRail();
  const bar = $('#stageBar');
  bar.classList.add('open');
  bar.innerHTML = '';
  const s = state.session;

  if(s){
    const meta = document.createElement('div');
    meta.className = 'session-meta';
    meta.style.cursor = 'pointer';
    meta.title = 'Click to edit session details';
    const subBits = [s.customer, s.sessionType, s.date].filter(Boolean).join(' · ');
    meta.innerHTML = `<div class="session-title">${escapeHtml(s.title||'Untitled session')}</div>
      <div class="session-sub">${escapeHtml(subBits)}</div>`;
    meta.addEventListener('click', openSessionModal);
    bar.appendChild(meta);
  }

  const tabs = document.createElement('div');
  tabs.className = 'stage-tabs';
  const stages = s ? s.stages : [{ name:'Canvas 1' }];
  const activeIndex = s ? s.activeIndex : 0;

  stages.forEach((st, i)=>{
    const b = document.createElement('button');
    b.type='button';
    b.className = 'stage-tab'+(i===activeIndex?' active':'');
    b.innerHTML = `<span class="stage-num">${i+1}</span><span>${escapeHtml(st.name)}</span>`;
    b.title = (st.description ? st.description + ' — ' : '') + 'Double-click to rename';
    b.addEventListener('click', ()=>{ if(s) switchStage(i); });
    b.addEventListener('dblclick', (e)=>{ e.preventDefault(); ensureSession(); renameStage(i); });
    if(stages.length > 1){
      const x = document.createElement('span');
      x.className = 'tab-close';
      x.textContent = '×';
      x.title = 'Close canvas';
      x.addEventListener('click', (e)=>{ e.stopPropagation(); closeStage(i); });
      b.appendChild(x);
    }
    tabs.appendChild(b);
  });

  const add = document.createElement('button');
  add.type='button';
  add.className = 'stage-tab-add';
  add.textContent = '+';
  add.title = 'New blank canvas tab';
  add.addEventListener('click', ()=> addBlankCanvas());
  tabs.appendChild(add);
  bar.appendChild(tabs);

  if(s){
    const edit = document.createElement('button');
    edit.className = 'btn ghost sm';
    edit.textContent = 'Edit details';
    edit.addEventListener('click', openSessionModal);
    bar.appendChild(edit);

    const exit = document.createElement('button');
    exit.className = 'btn ghost sm';
    exit.textContent = 'End session';
    exit.title = 'Clear session metadata and extra tabs (keeps current canvas)';
    exit.addEventListener('click', ()=>{
      if(!confirm('End the session? Metadata and other tabs are cleared; the current canvas stays.')) return;
      persistCurrentStage();
      state.session = null;
      renderAll(); save();
    });
    bar.appendChild(exit);
  }
}

// ============ Session details modal ============
function openSessionModal(){
  const s = state.session || {};
  $('#sfTitle').value    = s.title || '';
  $('#sfCustomer').value = s.customer || '';
  $('#sfDate').value     = s.date || '';
  $('#sfType').value     = s.sessionType || '';
  $('#sfDesc').value     = s.description || '';
  $('#sessionModal').classList.add('open');
  setTimeout(()=> $('#sfTitle').focus(), 30);
}
function closeSessionModal(){ $('#sessionModal').classList.remove('open'); }
function saveSessionModal(){
  const title = $('#sfTitle').value.trim().slice(0,120);
  const customer = $('#sfCustomer').value.trim().slice(0,120);
  const date = $('#sfDate').value;
  const sessionType = $('#sfType').value;
  const description = $('#sfDesc').value.trim().slice(0,800);
  if(!title && !customer && !date && !sessionType && !description){
    state.session = null;
  } else {
    const base = state.session || { stages:[], activeIndex:0 };
    state.session = Object.assign(base, { title, customer, date, sessionType, description });
  }
  closeSessionModal();
  renderStageBar(); save();
}

// ============ Spotlight ============
let currentSpotPrompt = null;

function inferCanvasTypeFromPrompt(p){
  if(!p) return null;
  const a = p.activity || {};
  const explicit = p.canvasType || a.canvasType || a.layout || a.canvas;
  if(explicit) return normalizeCanvasType(explicit);
  const at = String(a.activityType || p.activityType || '').toLowerCase().trim();
  if(at && ACTIVITY_TYPE_CANVAS[at]) return ACTIVITY_TYPE_CANVAS[at];
  if(p.stageCanvasType) return normalizeCanvasType(p.stageCanvasType);
  const hay = [a.activityType, a.title, p.category, p.text, a.prompt].filter(Boolean).join(' ').toLowerCase();
  if(!hay) return null;
  const rules = [
    [/back[- ]?cast|future[- ]?back|future[- ]?state|pre[- ]?mortem|working[- ]?backwards|what had to be true/, 'backcast'],
    [/empathy/, 'empathy'],
    [/journey|experience map|service blueprint/, 'journey'],
    [/raci/, 'raci'],
    [/strategy on a page|strategy page|vision|3\/6\/12|okrs?/, 'strategy'],
    [/mind ?map|affinity/, 'mindmap'],
    [/2 ?x ?2|matrix|prioriti[sz]ation|impact.*effort|effort.*impact|dot ?vote/, 'matrix2x2'],
    [/swimlane|process map|process mapping|workflow|hand[- ]?off/, 'hswimlanes'],
    [/retro(spective)?|reflection/, 'vswimlanes'],
    [/use[- ]?case|opportunity canvas|job[- ]?to[- ]?be[- ]?done|jtbd/, 'usecase'],
  ];
  for(const [re,val] of rules){ if(re.test(hay)) return val; }
  return null;
}

function switchCanvasType(ct){
  if(!ct || ct===state.canvasType) return false;
  state.canvasType = ct;
  const sel = $('#canvasType'); if(sel) sel.value = ct;
  applyCanvasTheme();
  renderLanesLayer();
  return true;
}

export function openSpotlight(prompt){
  currentSpotPrompt = prompt;
  window.__lastPrompt = { text: (prompt.activity && prompt.activity.prompt) || prompt.text, category: prompt.category || (prompt.activity && prompt.activity.activityType) || '' };
  const a = prompt.activity || {};
  const spotEl = $('#spotlight');
  $('#spotCat').textContent = (prompt.category || a.activityType || 'Prompt');
  $('#spotMeta').textContent = a.timebox ? a.timebox : '';
  $('#spotTitle').textContent = a.title || prompt.text;
  $('#spotPrompt').textContent = a.prompt || prompt.text;

  const ctx = $('#spotContext');
  if(a.context){ ctx.textContent = a.context; ctx.style.display='block'; } else { ctx.style.display='none'; }

  const notesWrap = $('#spotNotesWrap');
  if(a.activityInstructions){ $('#spotNotes').textContent = a.activityInstructions; notesWrap.style.display='block'; }
  else notesWrap.style.display='none';

  const capWrap = $('#spotCaptureWrap');
  if(Array.isArray(a.captureAreas) && a.captureAreas.length){
    $('#spotChips').innerHTML = a.captureAreas.map(c=>`<span class="spotlight-chip">${escapeHtml(c)}</span>`).join('');
    capWrap.style.display='block';
  } else capWrap.style.display='none';

  spotEl.classList.add('open');
  document.getElementById('spotlightBackdrop').classList.add('open');
}

function closeSpotlight(){
  $('#spotlight').classList.remove('open');
  document.getElementById('spotlightBackdrop').classList.remove('open');
  currentSpotPrompt=null;
}

export function openBrief(prompt){
  const a = prompt.activity || {};
  $('#briefTitle').textContent = a.title || prompt.text;
  $('#briefMeta').textContent = [a.activityType, a.timebox].filter(Boolean).join(' · ');
  const parts = [];
  if(a.context)               parts.push(`<p style="margin:0 0 10px;color:var(--ink-2)"><em>${escapeHtml(a.context)}</em></p>`);
  if(a.prompt)                parts.push(`<div style="padding:12px 14px;background:#f4f7fb;border-left:3px solid var(--accent);border-radius:6px;margin:0 0 12px;font-size:13.5px">${escapeHtml(a.prompt)}</div>`);
  if(a.activityInstructions)  parts.push(`<p style="margin:0 0 6px;font-weight:600">Collaborative guidance</p><p style="margin:0 0 12px">${escapeHtml(a.activityInstructions)}</p>`);
  if(Array.isArray(a.captureAreas) && a.captureAreas.length){
    parts.push(`<p style="margin:0 0 6px;font-weight:600">Capture</p><div style="display:flex;flex-wrap:wrap;gap:6px">${
      a.captureAreas.map(c=>`<span style="font-size:11px;padding:3px 9px;border-radius:999px;background:#eef0f3;color:var(--ink-2)">${escapeHtml(c)}</span>`).join('')
    }</div>`);
  }
  $('#briefBody').innerHTML = parts.join('') || '<p style="color:var(--muted)">No additional detail.</p>';
  $('#briefDrop').onclick = ()=>{
    const cat = prompt.category || a.activityType || '';
    addCard({ type:'prompt', text: a.prompt || prompt.text, category: cat, x:260, y:200 });
    $('#briefModal').classList.remove('open');
  };
  $('#briefModal').classList.add('open');
}

// ============ Templates application ============
export function applyTemplate(key){
  const build = TEMPLATE_PACKS[key];
  if(!build) return;
  const t = build();
  if(t.multi){
    state.session = {
      title: t.session?.title || 'Session',
      customer: t.session?.customer || '',
      date: t.session?.date || '',
      sessionType: t.session?.sessionType || '',
      description: t.session?.description || '',
      stages: t.stages,
      activeIndex: 0,
    };
    loadStage(0);
    return;
  }
  state.canvasType = t.canvasType || 'whiteboard';
  state.lanes = t.lanes || [];
  state.prompts = t.prompts || [];
  state.cards = t.cards || [];
  state.connections = t.connections || [];
  state.view = t.view || {x:40,y:40,scale:1};
  clearSelection();
  $('#canvasType').value = state.canvasType;
  renderAll(); save();
}

// ============ Init session UI ============
export function initSessionUI(){
  // Session modal
  $('#btnSession').addEventListener('click', openSessionModal);
  $('#sfCancel').addEventListener('click', closeSessionModal);
  $('#sfSave').addEventListener('click', saveSessionModal);
  $('#sessionModal').addEventListener('click', e=>{ if(e.target.id==='sessionModal') closeSessionModal(); });

  // Brief modal
  $('#briefClose').addEventListener('click', ()=> $('#briefModal').classList.remove('open'));

  // Spotlight
  const spotEl = $('#spotlight');
  const viewport = document.getElementById('viewport');
  $('#spotClose').addEventListener('click', closeSpotlight);
  $('#spotDone').addEventListener('click', closeSpotlight);
  document.getElementById('spotlightBackdrop').addEventListener('click', closeSpotlight);

  $('#spotDrop').addEventListener('click', ()=>{
    if(!currentSpotPrompt) return;
    const a = currentSpotPrompt.activity || {};
    const text = a.prompt || currentSpotPrompt.text;
    const inferred = inferCanvasTypeFromPrompt(currentSpotPrompt);
    if(inferred) switchCanvasType(inferred);
    const r = viewport.getBoundingClientRect();
    const cx = (r.width/2 - state.view.x)/state.view.scale;
    const cy = (r.height/2 - state.view.y)/state.view.scale;
    const cat = currentSpotPrompt.category || (a.activityType) || '';
    addCard({ type:'prompt', text, category: cat, x: cx-160, y: cy-90 });
    save();
  });

  // Drag spotlight by header
  (function(){
    const header = $('#spotHeader');
    let dragging=false, offX=0, offY=0;
    header.addEventListener('mousedown', e=>{
      if(e.target.closest('button')) return;
      dragging=true;
      const r = spotEl.getBoundingClientRect();
      offX = e.clientX - r.left; offY = e.clientY - r.top;
      spotEl.style.right='auto'; spotEl.style.bottom='auto';
      e.preventDefault();
    });
    window.addEventListener('mousemove', e=>{
      if(!dragging) return;
      const w = spotEl.offsetWidth, h = spotEl.offsetHeight;
      let x = Math.max(8, Math.min(window.innerWidth - w - 8, e.clientX - offX));
      let y = Math.max(8, Math.min(window.innerHeight - h - 8, e.clientY - offY));
      spotEl.style.left = x+'px'; spotEl.style.top = y+'px';
    });
    window.addEventListener('mouseup', ()=> dragging=false);
  })();

  // Escape closes spotlight
  window.addEventListener('keydown', e=>{
    if(e.key==='Escape' && spotEl.classList.contains('open')) closeSpotlight();
  });

  // Template pack selector
  $('#templatePack').addEventListener('change', e=>{
    const key = e.target.value;
    if(!key) return;
    if(state.cards.length && !confirm('Load "'+e.target.selectedOptions[0].text+'" template? This will replace the current canvas.')){
      e.target.value=''; return;
    }
    applyTemplate(key);
    e.target.value='';
  });

  // Expose for cross-module access
  window.__openSpotlight = openSpotlight;
  window.__persistCurrentStage = persistCurrentStage;
  window.__renderStageBar = renderStageBar;
  window.__loadSessionFromSchema = loadSessionFromSchema;
}
