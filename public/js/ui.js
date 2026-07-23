// UI modules: flyout panels, timer, context menu
import { state, save } from './state.js';
import { $, isEditing } from './utils.js';
import { addCard, clearSelection, deleteCard, selectCard, applyView, clientToWorld, getCardSize, fitToView } from './render.js';
import { zoomAt, getClipboardCard, setClipboardCard } from './interactions.js';

// ============ Flyout Panels ============
function initFlyouts(){
  const left = $('#leftPanel'), right = $('#rightPanel'), scrim = $('#flyoutScrim');
  const tL = $('#btnTogglePalette'), tR = $('#btnTogglePrompts');
  function sync(){
    scrim.classList.remove('show');
    tL.classList.toggle('active', left.classList.contains('open'));
    tR.classList.toggle('active', right.classList.contains('open'));
  }
  function open(side){
    if(side==='left'){ left.classList.add('open'); right.classList.remove('open'); }
    else{ right.classList.add('open'); left.classList.remove('open'); }
    sync();
  }
  function toggle(side){
    const el = side==='left'?left:right;
    if(el.classList.contains('open')){ el.classList.remove('open'); sync(); }
    else open(side);
  }
  tL.addEventListener('click', ()=>toggle('left'));
  tR.addEventListener('click', ()=>toggle('right'));
  scrim.addEventListener('click', ()=>{ left.classList.remove('open'); right.classList.remove('open'); sync(); });
  document.addEventListener('keydown', e=>{
    if(isEditing()) return;
    if(e.key==='p' || e.key==='P'){ toggle('left'); }
    if(e.key==='q' || e.key==='Q'){ toggle('right'); }
    if(e.key==='Escape'){ left.classList.remove('open'); right.classList.remove('open'); sync(); }
  });
  window.__closeFlyouts = ()=>{ left.classList.remove('open'); right.classList.remove('open'); sync(); };
}

// ============ Timer ============
function initTimer(){
  const val = $('#timerVal'), widget = $('#timerWidget');
  const startBtn = $('#timerStart'), resetBtn = $('#timerReset'), setBtn = $('#timerSettings');
  const pop = $('#timerPop');
  let total = 5*60, remaining = total, running = false, tId = null;
  function fmt(s){ s=Math.max(0,s|0); const m=(s/60|0), r=s%60; return String(m).padStart(2,'0')+':'+String(r).padStart(2,'0'); }
  function paint(){
    val.textContent = fmt(remaining);
    widget.classList.toggle('warn', running && remaining>0 && remaining<=30);
    widget.classList.toggle('done', remaining===0);
    startBtn.innerHTML = running
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  }
  function tick(){
    if(!running) return;
    remaining -= 1;
    if(remaining<=0){
      remaining=0; running=false; clearInterval(tId); tId=null;
      paint();
      try{
        const ctx = new (window.AudioContext||window.webkitAudioContext)();
        const o=ctx.createOscillator(), g=ctx.createGain();
        o.frequency.value=880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(.001,ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(.3,ctx.currentTime+.02);
        g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.6);
        o.start(); o.stop(ctx.currentTime+.65);
      }catch(_){}
      return;
    }
    paint();
  }
  startBtn.addEventListener('click', ()=>{
    if(remaining<=0){ remaining=total; }
    running = !running;
    if(running){ tId = setInterval(tick,1000); } else { clearInterval(tId); tId=null; }
    paint();
  });
  resetBtn.addEventListener('click', ()=>{
    running=false; clearInterval(tId); tId=null; remaining=total; paint();
  });
  setBtn.addEventListener('click', e=>{
    e.stopPropagation();
    pop.classList.toggle('show');
    $('#timerMin').value = (total/60|0);
    $('#timerSec').value = total%60;
  });
  document.addEventListener('click', e=>{
    if(!pop.contains(e.target) && e.target!==setBtn){ pop.classList.remove('show'); }
  });
  $('#timerPopClose').addEventListener('click', ()=>pop.classList.remove('show'));
  pop.querySelectorAll('.presets button').forEach(b=>{
    b.addEventListener('click', ()=>{
      total = parseInt(b.dataset.sec,10);
      remaining = total; running=false; clearInterval(tId); tId=null;
      paint(); pop.classList.remove('show');
    });
  });
  $('#timerApply').addEventListener('click', ()=>{
    const m = Math.max(0, parseInt($('#timerMin').value||'0',10));
    const s = Math.max(0, Math.min(59, parseInt($('#timerSec').value||'0',10)));
    total = m*60 + s;
    remaining = total; running=false; clearInterval(tId); tId=null;
    paint(); pop.classList.remove('show');
  });
  paint();
}

// ============ Right-click Context Menu ============
function initContextMenu(){
  const menu = $('#ctxMenu');
  const viewport = document.getElementById('viewport');
  let ctxPt = null;
  const STICKY_HEX = ['#fff9b1','#ffd6e0','#cfe4ff','#d4f5c8','#ffe0b8','#e6d6ff'];
  const sw = $('#ctxSwatches');
  STICKY_HEX.forEach(hex=>{
    const b=document.createElement('button');
    b.style.background=hex; b.title='Sticky '+hex;
    b.addEventListener('click', ()=>{
      addCardAt('sticky', hex);
      hide();
    });
    sw.appendChild(b);
  });
  let shownAt = 0;
  function show(x,y){
    menu.style.left = Math.min(x, window.innerWidth-240)+'px';
    menu.style.top  = Math.min(y, window.innerHeight-380)+'px';
    menu.classList.add('show');
    shownAt = Date.now();
    const has = !!(window.__lastPrompt);
    $('#ctxPastePrompt').style.display = has?'flex':'none';
  }
  function hide(){ menu.classList.remove('show'); ctxPt=null; }
  function viewportCenterWorld(){
    const r = viewport.getBoundingClientRect();
    return clientToWorld(r.left + r.width/2, r.top + r.height/2);
  }
  function addCardAt(type, color){
    const p = ctxPt ? clientToWorld(ctxPt.x, ctxPt.y) : viewportCenterWorld();
    const w = (type==='sticky')?180:200, h=(type==='sticky')?120:80;
    addCard({type, x:p.x - w/2, y:p.y - h/2, text:'New '+type, color});
  }
  viewport.addEventListener('contextmenu', e=>{
    e.preventDefault();
    e.stopPropagation();
    const cardEl = e.target.closest('.card');
    if(cardEl) { hide(); showCardMenu(cardEl.dataset.id, e.clientX, e.clientY); return; }
    hideCardMenu();
    ctxPt = {x:e.clientX, y:e.clientY};
    show(e.clientX, e.clientY);
  });
  const outsideClose = e=>{
    if(!menu.classList.contains('show')) return;
    if(Date.now() - shownAt < 250) return;
    if(menu.contains(e.target)) return;
    hide();
  };
  document.addEventListener('mousedown', outsideClose, true);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') hide(); });
  menu.querySelectorAll('button[data-ctx]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const k = b.dataset.ctx;
      if(k==='fit'){ $('#btnFit').click(); }
      else if(k==='reset'){ $('#btnReset').click(); }
      else if(k==='paste-prompt' && window.__lastPrompt){
        const p = ctxPt ? clientToWorld(ctxPt.x, ctxPt.y) : viewportCenterWorld();
        addCard({type:'prompt', text:window.__lastPrompt.text, category:window.__lastPrompt.category||'', x:p.x-160, y:p.y-90});
      } else {
        addCardAt(k);
      }
      hide();
    });
  });
}

// ============ Card Context Menu ============
let ctxCardId = null, cardShownAt = 0, ctxCardPt = null;
function showCardMenu(id, x, y){
  const cardMenu = $('#ctxCardMenu');
  if(!cardMenu) return;
  ctxCardId = id;
  ctxCardPt = {x, y};
  selectCard(id);
  cardMenu.style.left = Math.min(x, window.innerWidth-220)+'px';
  cardMenu.style.top  = Math.min(y, window.innerHeight-240)+'px';
  cardMenu.classList.add('show');
  cardShownAt = Date.now();
  const pasteBtn = cardMenu.querySelector('[data-cctx="paste"]');
  if(pasteBtn) pasteBtn.style.display = getClipboardCard() ? 'flex' : 'none';
}
function hideCardMenu(){ const m=$('#ctxCardMenu'); if(m) m.classList.remove('show'); ctxCardId=null; ctxCardPt=null; }

function initCardContextMenu(){
  const cardMenu = $('#ctxCardMenu');
  if(!cardMenu) return;
  const viewport = document.getElementById('viewport');
  function viewportCenterWorld(){
    const r = viewport.getBoundingClientRect();
    return clientToWorld(r.left + r.width/2, r.top + r.height/2);
  }
  cardMenu.querySelectorAll('button[data-cctx]').forEach(b=>{
    b.addEventListener('click', ()=>{
      const k = b.dataset.cctx;
      const c = state.cards.find(x=>x.id===ctxCardId);
      if(!c && k!=='paste'){ hideCardMenu(); return; }
      if(k==='copy'){
        setClipboardCard(JSON.parse(JSON.stringify(c)));
      } else if(k==='duplicate'){
        const {id, painScoreId, ...rest} = c;
        addCard({...rest, x:c.x+24, y:c.y+24, painPoint:false, painScoreId:undefined});
      } else if(k==='paste' && getClipboardCard()){
        const clip = getClipboardCard();
        const p = ctxCardPt ? clientToWorld(ctxCardPt.x, ctxCardPt.y) : viewportCenterWorld();
        const {id, painScoreId, ...rest} = clip;
        addCard({...rest, x:p.x, y:p.y, painPoint:false, painScoreId:undefined});
        setClipboardCard(JSON.parse(JSON.stringify({...rest, x:p.x+24, y:p.y+24})));
      } else if(k==='delete'){
        deleteCard(c.id);
      }
      hideCardMenu();
    });
  });
  const outsideCloseCard = e=>{
    if(!cardMenu.classList.contains('show')) return;
    if(Date.now() - cardShownAt < 250) return;
    if(cardMenu.contains(e.target)) return;
    hideCardMenu();
  };
  document.addEventListener('mousedown', outsideCloseCard, true);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') hideCardMenu(); });
}

// ============ Toolbar buttons ============
function initToolbar(){
  const viewport = document.getElementById('viewport');
  $('#btnFit').addEventListener('click', fitToView);
  $('#btnReset').addEventListener('click', ()=>{state.view={x:40,y:40,scale:1}; applyView()});
  $('#btnZoomIn').addEventListener('click', ()=>{const r=viewport.getBoundingClientRect();zoomAt(r.left+r.width/2, r.top+r.height/2, state.view.scale*1.2)});
  $('#btnZoomOut').addEventListener('click', ()=>{const r=viewport.getBoundingClientRect();zoomAt(r.left+r.width/2, r.top+r.height/2, state.view.scale/1.2)});

  // toolMode click handled in main.js to avoid circular dependency
}

export { fitToView };

// ============ Init all UI ============
export function initUI(){
  initFlyouts();
  initTimer();
  initContextMenu();
  initCardContextMenu();
  initToolbar();
}
