// Main entry point — imports all modules, initialises the app
import { state, load, save } from './state.js';
import { $ } from './utils.js';
import {
  initDomRefs,
  renderAll, renderPalette, renderLanes, renderPrompts, renderCards,
  renderConnections, applyView, applyCanvasTheme, renderLanesLayer,
  clearSelection, laneDefaultSize,
} from './render.js';
import { initInteractions, setToolMode } from './interactions.js';
import { initExportUI, updateSmartExportLabel } from './export.js';
import { renderStageBar, initSessionUI, applyTemplate, persistCurrentStage } from './session.js';
import { initUI, fitToView } from './ui.js';
import { LANE_COLORS } from './constants.js';

// Wire tool mode from UI to interactions
$('#toolMode')?.addEventListener('click', e=>{
  const b=e.target.closest('button'); if(!b) return;
  setToolMode(b.dataset.mode);
  const viewport = document.getElementById('viewport');
  $('#toolMode').querySelectorAll('button').forEach(x=>x.classList.toggle('active', x===b));
  viewport.classList.toggle('connecting', b.dataset.mode==='connect');
});

// Canvas type change
$('#canvasType').addEventListener('change', e=>{
  state.canvasType = e.target.value;
  applyCanvasTheme();
  renderLanesLayer();
  renderAll();
  save();
});

// Expose renderAll for modules that call it
window.__renderAll = renderAll;

// Init DOM references first
initDomRefs();

// Init all subsystems
initInteractions();
initExportUI();
initSessionUI();
initUI();

// Clear canvas button
$('#btnClear')?.addEventListener('click', ()=>{
  if(!confirm('Clear all swimlanes, prompts, questions, cards and connections?')) return;
  state.session = null;
  state.canvasType = 'whiteboard';
  state.lanes = [];
  state.prompts = [];
  state.cards = [];
  state.connections = [];
  state.view = {x:40, y:40, scale:1};
  clearSelection();
  $('#canvasType').value = 'whiteboard';
  renderAll();
  save();
});

// Add lane button
$('#btnAddLane')?.addEventListener('click', ()=>{
  const id='l'+Date.now();
  const orient = state.canvasType==='vswimlanes' ? 'v' : 'h';
  state.lanes.push({
    id, name:'Lane '+(state.lanes.length+1),
    color:LANE_COLORS[state.lanes.length%LANE_COLORS.length],
    orientation: orient, size: laneDefaultSize(orient)
  });
  renderLanes(); renderLanesLayer(); save();
});

// Load saved state or default template
if(!load()){
  applyTemplate('sample');
} else {
  $('#canvasType').value = state.canvasType;
  renderAll();
}
