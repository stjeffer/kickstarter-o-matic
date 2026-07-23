// Interaction handlers: drag, pan, zoom, connect, resize
import { state, save } from './state.js';
import { CARD_TYPES } from './card-types.js';
import { WORLD_W, WORLD_H } from './constants.js';
import { isEditing } from './utils.js';
import {
  getCardsLayer, getViewport, getConnLayer,
  clientToWorld, applyView, renderCards, renderConnections,
  selectCard, selectConn, clearSelection, deleteCard, addCard, addMindmapChild,
  getCardEl, getCardSize, anchorPoint, curvePath, hitTestGroup, applyCanvasTheme,
  renderLanesLayer,
} from './render.js';

let toolMode = 'select';
let spaceDown = false;
let clipboardCard = null;
export function getClipboardCard() { return clipboardCard; }
export function setClipboardCard(c) { clipboardCard = c; }
let lastMouseClient = {x:null, y:null};
let dragState = null, panState = null, connectState = null;

export function getToolMode() { return toolMode; }
export function setToolMode(mode) { toolMode = mode; }

// ============ Resize ============
let resizeState = null;

export function startResize(id, e) {
  const c = state.cards.find(x => x.id === id);
  if (!c) return;
  const el = getCardEl(id);
  const body = el && el.querySelector('.card-body');
  if (!body) return;
  const start = clientToWorld(e.clientX, e.clientY);
  const startW = body.offsetWidth;
  const startH = body.offsetHeight;
  resizeState = { id, startX: start.x, startY: start.y, startW, startH };
  window.addEventListener('mousemove', onResizeMove);
  window.addEventListener('mouseup', endResize);
}

function onResizeMove(e) {
  if (!resizeState) return;
  const p = clientToWorld(e.clientX, e.clientY);
  const c = state.cards.find(x => x.id === resizeState.id);
  if (!c) return;
  const newW = Math.max(180, Math.round(resizeState.startW + (p.x - resizeState.startX)));
  const newH = Math.max(80, Math.round(resizeState.startH + (p.y - resizeState.startY)));
  c.w = newW; c.h = newH;
  const el = getCardEl(c.id);
  const body = el && el.querySelector('.card-body');
  if (body) { body.style.width = newW + 'px'; body.style.minHeight = newH + 'px'; }
  renderConnections();
}

function endResize() {
  resizeState = null;
  window.removeEventListener('mousemove', onResizeMove);
  window.removeEventListener('mouseup', endResize);
  save();
}

// Group frame resize
let groupResizeState = null;

export function startGroupResize(id, e) {
  const c = state.cards.find(x => x.id === id);
  if (!c) return;
  const start = clientToWorld(e.clientX, e.clientY);
  groupResizeState = { id, startX: start.x, startY: start.y, startW: c.w || 340, startH: c.h || 220 };
  window.addEventListener('mousemove', onGroupResizeMove);
  window.addEventListener('mouseup', endGroupResize);
}

function onGroupResizeMove(e) {
  if (!groupResizeState) return;
  const p = clientToWorld(e.clientX, e.clientY);
  const c = state.cards.find(x => x.id === groupResizeState.id);
  if (!c) return;
  c.w = Math.max(200, Math.round(groupResizeState.startW + (p.x - groupResizeState.startX)));
  c.h = Math.max(140, Math.round(groupResizeState.startH + (p.y - groupResizeState.startY)));
  const el = getCardEl(c.id); const body = el && el.querySelector('.card-body');
  if (body) { body.style.width = c.w + 'px'; body.style.height = c.h + 'px'; }
}

function endGroupResize() {
  groupResizeState = null;
  window.removeEventListener('mousemove', onGroupResizeMove);
  window.removeEventListener('mouseup', endGroupResize);
  state.cards.forEach(c => { if (c.type !== 'group') c.groupId = hitTestGroup(c); });
  renderCards(); save();
}

// ============ Drag ============
function startDrag(id, e) {
  const c = state.cards.find(c => c.id === id);
  if (!c) return;
  const start = clientToWorld(e.clientX, e.clientY);
  dragState = { id, ox: start.x - c.x, oy: start.y - c.y };
  const el = getCardEl(id); el && el.classList.add('dragging');
  const move = ev => {
    const p = clientToWorld(ev.clientX, ev.clientY);
    c.x = p.x - dragState.ox;
    c.y = p.y - dragState.oy;
    const e2 = getCardEl(id);
    if (e2) { e2.style.left = c.x + 'px'; e2.style.top = c.y + 'px'; }
    renderConnections();
  };
  const up = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    const e2 = getCardEl(id); e2 && e2.classList.remove('dragging');
    dragState = null;
    if (c.type !== 'group') {
      const prev = c.groupId;
      c.groupId = hitTestGroup(c);
      if (c.groupId !== prev) { renderCards(); }
    }
    save();
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

// ============ Connect ============
function startConnect(fromId, fromAnchor, e) {
  connectState = { fromId, fromAnchor };
  const viewport = getViewport();
  viewport.classList.add('connecting');
  const from = state.cards.find(c => c.id === fromId);
  const p1 = anchorPoint(from, fromAnchor);
  const connLayer = getConnLayer();
  const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tempPath.setAttribute('class', 'conn-line');
  tempPath.setAttribute('stroke-dasharray', '5,4');
  connLayer.appendChild(tempPath);
  const move = ev => {
    const p2 = clientToWorld(ev.clientX, ev.clientY);
    tempPath.setAttribute('d', curvePath(p1, p2, fromAnchor, 'left'));
  };
  const up = ev => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    viewport.classList.remove('connecting');
    tempPath.remove();
    const target = document.elementFromPoint(ev.clientX, ev.clientY);
    const anchorEl = target && target.closest('.anchor');
    const cardEl = target && target.closest('.card');
    if (cardEl && cardEl.dataset.id !== fromId) {
      const toAnchor = anchorEl ? anchorEl.dataset.anchor : nearestAnchor(cardEl.dataset.id, ev);
      state.connections.push({ id: 'c' + Date.now(), from: fromId, to: cardEl.dataset.id, fromAnchor, toAnchor });
      renderConnections(); save();
    }
    connectState = null;
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}

function nearestAnchor(cardId, ev) {
  const c = state.cards.find(c => c.id === cardId);
  const s = getCardSize(c);
  const p = clientToWorld(ev.clientX, ev.clientY);
  const dx = p.x - (c.x + s.w / 2), dy = p.y - (c.y + s.h / 2);
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top');
}

// ============ Zoom ============
export function zoomAt(cx, cy, newScale) {
  newScale = Math.max(.2, Math.min(3, newScale));
  const viewport = getViewport();
  const rect = viewport.getBoundingClientRect();
  const px = cx - rect.left, py = cy - rect.top;
  const wx = (px - state.view.x) / state.view.scale;
  const wy = (py - state.view.y) / state.view.scale;
  state.view.scale = newScale;
  state.view.x = px - wx * newScale;
  state.view.y = py - wy * newScale;
  applyView();
}

// ============ Toggle pain point ============
import { togglePainPoint } from './render.js';

// ============ Init interactions ============
export function initInteractions() {
  const viewport = getViewport();
  const cardsLayer = getCardsLayer();

  // Drop from palette
  viewport.addEventListener('dragover', e => {
    if (e.dataTransfer.types.includes('application/x-card-type')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
  });
  viewport.addEventListener('drop', e => {
    const type = e.dataTransfer.getData('application/x-card-type');
    if (!type) return;
    e.preventDefault();
    const pt = clientToWorld(e.clientX, e.clientY);
    const promptText = e.dataTransfer.getData('application/x-prompt');
    const promptCategory = e.dataTransfer.getData('application/x-prompt-category');
    const color = e.dataTransfer.getData('application/x-card-color');
    const emoji = e.dataTransfer.getData('application/x-card-emoji');
    const presetText = e.dataTransfer.getData('application/x-card-text');
    const def = CARD_TYPES[type].defaults;
    const card = {
      type,
      x: pt.x - def.w / 2,
      y: pt.y - def.h / 2,
      text: promptText || presetText || def.text,
    };
    if (promptCategory) card.category = promptCategory;
    if (color) card.color = color;
    if (emoji) card.emoji = emoji;
    else if (type === 'emotion' && def.emoji) card.emoji = def.emoji;
    addCard(card);
  });

  // Card mousedown
  cardsLayer.addEventListener('mousedown', e => {
    const anchor = e.target.closest('.anchor');
    const cardEl = e.target.closest('.card');
    if (anchor && cardEl) {
      e.stopPropagation(); e.preventDefault();
      startConnect(cardEl.dataset.id, anchor.dataset.anchor, e);
      return;
    }
    if (!cardEl) return;
    if (e.target.closest('.card-tools')) return;
    if (e.target.isContentEditable) return;
    e.stopPropagation();
    selectCard(cardEl.dataset.id);
    if (toolMode === 'select') {
      startDrag(cardEl.dataset.id, e);
    }
  });

  // Double-click to edit
  cardsLayer.addEventListener('dblclick', e => {
    const cardEl = e.target.closest('.card');
    if (!cardEl) return;
    const body = cardEl.querySelector('.card-body');
    const c = state.cards.find(c => c.id === cardEl.dataset.id);
    if (c && c.type === 'prompt') {
      const ptext = body.querySelector('.prompt-text');
      if (ptext) {
        ptext.setAttribute('contenteditable', 'true');
        ptext.focus();
        document.getSelection().selectAllChildren(ptext);
        ptext.addEventListener('blur', () => {
          ptext.removeAttribute('contenteditable');
          c.text = ptext.textContent;
          save(); renderConnections();
        }, { once: true });
        return;
      }
    }
    const txtEl = body.querySelector('.txt') || body;
    txtEl.setAttribute('contenteditable', 'true');
    txtEl.focus();
    document.getSelection().selectAllChildren(txtEl);
    txtEl.addEventListener('blur', () => {
      txtEl.removeAttribute('contenteditable');
      if (c) { c.text = txtEl.textContent; save(); renderConnections(); }
    }, { once: true });
  });

  // Card tool buttons
  cardsLayer.addEventListener('click', e => {
    const dot = e.target.closest('.ps-dot');
    if (dot) {
      const cardEl = e.target.closest('.card');
      const c = state.cards.find(x => x.id === cardEl.dataset.id);
      if (c && c.type === 'painscore') {
        const key = dot.dataset.psKey;
        const val = parseInt(dot.dataset.psVal, 10);
        c.scores = c.scores || { frequency: 0, impact: 0, population: 0 };
        c.scores[key] = c.scores[key] === val ? val - 1 : val;
        renderCards(); save();
      }
      return;
    }
    const tool = e.target.closest('[data-act]');
    if (!tool) return;
    const cardEl = e.target.closest('.card');
    const id = cardEl.dataset.id;
    const act = tool.dataset.act;
    if (act === 'del') deleteCard(id);
    else if (act === 'pain') togglePainPoint(id);
    else if (act === 'dup') {
      const c = state.cards.find(c => c.id === id);
      addCard({ ...c, id: undefined, x: c.x + 20, y: c.y + 20, painPoint: false, painScoreId: undefined });
    } else if (act === 'edit') {
      cardEl.querySelector('.card-body').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    }
  });

  // Pan / zoom
  viewport.addEventListener('mousedown', e => {
    if (e.target.closest('.card')) return;
    if (e.button === 2) return;
    const isPan = e.button === 1 || e.shiftKey || spaceDown;
    if (!isPan && e.button === 0) { clearSelection(); return; }
    e.preventDefault();
    viewport.classList.add('panning');
    panState = { sx: e.clientX, sy: e.clientY, vx: state.view.x, vy: state.view.y };
    const move = ev => {
      state.view.x = panState.vx + (ev.clientX - panState.sx);
      state.view.y = panState.vy + (ev.clientY - panState.sy);
      applyView();
    };
    const up = () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      viewport.classList.remove('panning');
      panState = null;
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });

  viewport.addEventListener('contextmenu', e => e.preventDefault());

  viewport.addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      zoomAt(e.clientX, e.clientY, state.view.scale * factor);
    } else {
      state.view.x -= e.deltaX;
      state.view.y -= e.deltaY;
      applyView();
    }
  }, { passive: false });

  viewport.addEventListener('click', e => {
    if (!e.target.closest('.card') && !e.target.closest('.conn-hit')) clearSelection();
  });

  // Track mouse position for paste placement
  viewport.addEventListener('mousemove', e => { lastMouseClient.x = e.clientX; lastMouseClient.y = e.clientY; });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && !isEditing()) { spaceDown = true; viewport.style.cursor = 'grab'; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isEditing()) {
      if (state.selection.cardId) { deleteCard(state.selection.cardId); e.preventDefault(); }
      else if (state.selection.connId) {
        state.connections = state.connections.filter(c => c.id !== state.selection.connId);
        state.selection.connId = null; renderConnections(); save();
      }
    }
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key === 'c' || e.key === 'C') && !isEditing() && state.selection.cardId) {
      const c = state.cards.find(x => x.id === state.selection.cardId);
      if (c) { clipboardCard = JSON.parse(JSON.stringify(c)); e.preventDefault(); }
    }
    if (mod && (e.key === 'v' || e.key === 'V') && !isEditing() && clipboardCard) {
      e.preventDefault();
      let x, y;
      if (lastMouseClient.x != null) {
        const p = clientToWorld(lastMouseClient.x, lastMouseClient.y);
        x = p.x; y = p.y;
      } else {
        x = (clipboardCard.x || 200) + 24; y = (clipboardCard.y || 200) + 24;
      }
      const {id, painScoreId, ...rest} = clipboardCard;
      const nc = addCard({...rest, x, y, painPoint: false, painScoreId: undefined});
      clipboardCard = JSON.parse(JSON.stringify({...rest, x: x + 24, y: y + 24}));
      if (nc && nc.id) selectCard(nc.id);
    }
    if ((e.key === 'Tab') && !isEditing() && state.canvasType === 'mindmap' && state.selection.cardId) {
      e.preventDefault(); addMindmapChild(state.selection.cardId);
    }
    if (e.key === 'Escape') { clearSelection(); }
  });
  document.addEventListener('keyup', e => { if (e.code === 'Space') { spaceDown = false; viewport.style.cursor = ''; } });

  // Expose resize functions for card elements
  window.__startResize = startResize;
  window.__startGroupResize = startGroupResize;
}
