// Main entry point — imports all modules, initialises the app
import { state, load, save } from './state.js';
import { $ } from './utils.js';
import {
  renderAll, renderPalette, renderLanes, renderPrompts, renderCards,
  renderConnections, applyView, applyCanvasTheme, renderLanesLayer,
  clearSelection,
} from './render.js';
import { initInteractions, setToolMode } from './interactions.js';
import { initExportUI, updateSmartExportLabel } from './export.js';
import { renderStageBar, initSessionUI, applyTemplate, persistCurrentStage } from './session.js';
import { initUI, fitToView } from './ui.js';

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

// Init all subsystems
initInteractions();
initExportUI();
initSessionUI();
initUI();

// Load saved state or default template
if(!load()){
  applyTemplate('sample');
} else {
  $('#canvasType').value = state.canvasType;
  renderAll();
}
