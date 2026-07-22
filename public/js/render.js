// Rendering functions
import { state, save } from './state.js';
import { CARD_TYPES } from './card-types.js';
import { WORLD_W, WORLD_H, LANE_COLORS, STICKY_COLORS, EMOTION_PRESETS, CANVAS_META } from './constants.js';
import { $, escapeHtml, uid } from './utils.js';

// DOM refs (set after DOM ready)
let world, viewport, cardsLayer, lanesLayer, connLayer;

export function initDomRefs() {
  world = $('#world');
  viewport = $('#viewport');
  cardsLayer = $('#cardsLayer');
  lanesLayer = $('#lanesLayer');
  connLayer = $('#connLayer');
}

export function getWorld() { return world; }
export function getViewport() { return viewport; }
export function getCardsLayer() { return cardsLayer; }
export function getConnLayer() { return connLayer; }

// ============ View ============
export function applyView() {
  world.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.scale})`;
  world.style.width = WORLD_W + 'px';
  world.style.height = WORLD_H + 'px';
  connLayer.setAttribute('width', WORLD_W);
  connLayer.setAttribute('height', WORLD_H);
  connLayer.style.width = WORLD_W + 'px';
  connLayer.style.height = WORLD_H + 'px';
  $('#zoomLevel').textContent = Math.round(state.view.scale * 100) + '%';
}

export function applyCanvasTheme() {
  const ct = state.canvasType || 'whiteboard';
  const meta = CANVAS_META[ct] || CANVAS_META.whiteboard;
  const stage = $('#stage');
  if (stage) stage.setAttribute('data-canvas', ct);
  world.className = 'world ' + ct;
  const badge = $('#canvasBadgeText');
  if (badge) badge.textContent = meta.label;
}

export function clientToWorld(cx, cy) {
  const rect = viewport.getBoundingClientRect();
  return { x: (cx - rect.left - state.view.x) / state.view.scale, y: (cy - rect.top - state.view.y) / state.view.scale };
}

export function viewportCenterWorld() {
  const rect = viewport.getBoundingClientRect();
  return clientToWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

// ============ Lane helpers ============
function laneDefaultSize(orient) {
  return orient === 'v' ? Math.round(WORLD_W / 4) : Math.round(WORLD_H / 4);
}

function ensureLaneDefaults(l) {
  if (!l.orientation) l.orientation = (state.canvasType === 'vswimlanes' ? 'v' : 'h');
  if (!l.size || typeof l.size !== 'number') l.size = laneDefaultSize(l.orientation);
  return l;
}

// ============ Palette ============
let _activePaletteTab = 'Sticky Notes';

function makePaletteItem({ label, title, iconHTML, dataMap }) {
  const it = document.createElement('div');
  it.className = 'palette-item';
  it.draggable = true;
  if (title) it.title = title;
  it.innerHTML = `<div class="palette-icon">${iconHTML}</div><div class="palette-label">${label}</div>`;
  it.addEventListener('dragstart', e => {
    Object.entries(dataMap).forEach(([k, v]) => e.dataTransfer.setData(k, v));
    e.dataTransfer.effectAllowed = 'copy';
  });
  return it;
}

export function renderPalette() {
  const el = $('#palette');
  el.innerHTML = '';

  const groups = {};
  Object.entries(CARD_TYPES).forEach(([type, def]) => {
    const g = def.group || 'Cards';
    (groups[g] = groups[g] || []).push([type, def]);
  });

  const tabsMeta = [
    { name: 'Sticky Notes', short: 'Stickies' },
    { name: 'Flow Shapes', short: 'Shapes' },
    { name: 'Experience', short: 'Experience' },
    { name: 'Workflow', short: 'Workflow' },
    { name: 'Prompt', short: 'Prompt' },
  ].filter(t => groups[t.name]);

  if (!tabsMeta.find(t => t.name === _activePaletteTab)) _activePaletteTab = tabsMeta[0]?.name;

  const tabs = document.createElement('div');
  tabs.className = 'palette-tabs';
  tabs.setAttribute('role', 'tablist');
  tabsMeta.forEach(t => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'palette-tab' + (t.name === _activePaletteTab ? ' active' : '');
    b.textContent = t.short;
    b.setAttribute('role', 'tab');
    b.addEventListener('click', () => { _activePaletteTab = t.name; renderPalette(); });
    tabs.appendChild(b);
  });
  el.appendChild(tabs);

  tabsMeta.forEach(t => {
    const panel = document.createElement('div');
    panel.className = 'palette-panel' + (t.name === _activePaletteTab ? ' active' : '');

    const buildGrid = (items) => {
      const grid = document.createElement('div');
      grid.className = 'palette-grid';
      items.forEach(fn => grid.appendChild(fn()));
      return grid;
    };

    const coreItems = groups[t.name].map(([type, def]) => () => makePaletteItem({
      label: def.label, iconHTML: def.icon(), dataMap: { 'application/x-card-type': type },
    }));

    if (t.name === 'Sticky Notes') {
      const l1 = document.createElement('div'); l1.className = 'palette-section-label'; l1.textContent = 'Basic'; panel.appendChild(l1);
      panel.appendChild(buildGrid(coreItems));
      const l2 = document.createElement('div'); l2.className = 'palette-section-label'; l2.textContent = 'Colors'; panel.appendChild(l2);
      panel.appendChild(buildGrid(STICKY_COLORS.map(sc => () => makePaletteItem({
        label: sc.name, title: sc.name + ' sticky',
        iconHTML: `<svg width="36" height="30" viewBox="0 0 36 30"><rect x="6" y="4" width="24" height="22" rx="1.5" fill="${sc.color}" stroke="rgba(0,0,0,.15)" transform="rotate(-2 18 15)"/></svg>`,
        dataMap: { 'application/x-card-type': 'sticky', 'application/x-card-color': sc.color },
      }))));
    } else if (t.name === 'Experience') {
      const l1 = document.createElement('div'); l1.className = 'palette-section-label'; l1.textContent = 'Cards'; panel.appendChild(l1);
      panel.appendChild(buildGrid(coreItems));
      const l2 = document.createElement('div'); l2.className = 'palette-section-label'; l2.textContent = 'Emotions'; panel.appendChild(l2);
      panel.appendChild(buildGrid(EMOTION_PRESETS.map(p => () => makePaletteItem({
        label: p.label, title: p.label + ' emotion',
        iconHTML: `<div style="font-size:26px;line-height:1">${p.emoji}</div>`,
        dataMap: {
          'application/x-card-type': 'emotion',
          'application/x-card-emoji': p.emoji,
          'application/x-card-text': p.label,
        },
      }))));
    } else if (t.name === 'Flow Shapes') {
      const titleItems = groups[t.name].filter(([type]) => type === 'title');
      const otherItems = groups[t.name].filter(([type]) => type !== 'title');
      if (titleItems.length) {
        const l0 = document.createElement('div'); l0.className = 'palette-section-label'; l0.textContent = 'Canvas Header'; panel.appendChild(l0);
        panel.appendChild(buildGrid(titleItems.map(([type, def]) => () => makePaletteItem({
          label: def.label, iconHTML: def.icon(), dataMap: { 'application/x-card-type': type },
        }))));
      }
      const l1 = document.createElement('div'); l1.className = 'palette-section-label'; l1.textContent = 'Process'; panel.appendChild(l1);
      panel.appendChild(buildGrid(otherItems.map(([type, def]) => () => makePaletteItem({
        label: def.label, iconHTML: def.icon(), dataMap: { 'application/x-card-type': type },
      }))));
    } else {
      panel.appendChild(buildGrid(coreItems));
    }

    el.appendChild(panel);
  });
}

// ============ Lanes ============
export function renderLanes() {
  const list = $('#lanes');
  list.innerHTML = '';
  if (state.lanes.length === 0) {
    list.innerHTML = '<div class="empty" style="padding:8px 0">No lanes yet.</div>';
  }
  state.lanes.forEach(lane => {
    ensureLaneDefaults(lane);
    const row = document.createElement('div');
    row.className = 'lane-item';
    row.innerHTML = `
      <span class="lane-swatch" style="background:${lane.color}"></span>
      <input class="lane-name" value="${escapeHtml(lane.name)}" />
      <span class="lane-orient" title="Orientation">
        <button data-o="h" class="${lane.orientation === 'h' ? 'active' : ''}">H</button>
        <button data-o="v" class="${lane.orientation === 'v' ? 'active' : ''}">V</button>
      </span>
      <button class="btn ghost sm" data-del="${lane.id}" title="Remove">✕</button>
    `;
    row.querySelector('.lane-name').addEventListener('change', e => { lane.name = e.target.value; renderLanesLayer(); save(); });
    row.querySelectorAll('.lane-orient button').forEach(b => {
      b.addEventListener('click', () => { lane.orientation = b.dataset.o; lane.size = laneDefaultSize(b.dataset.o); renderLanes(); renderLanesLayer(); save(); });
    });
    row.querySelector('[data-del]').addEventListener('click', () => {
      state.lanes = state.lanes.filter(l => l.id !== lane.id);
      renderLanes(); renderLanesLayer(); save();
    });
    list.appendChild(row);
  });
}

export function renderLanesLayer() {
  lanesLayer.innerHTML = '';
  const bands = computeLaneBands();
  bands.forEach(b => {
    const band = document.createElement('div');
    band.className = 'lane-band';
    band.style.cssText = `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;border-color:${b.color}40;background:${b.color}08`;
    lanesLayer.appendChild(band);

    const label = document.createElement('div');
    label.className = 'lane-label';
    if (b.orientation === 'v') {
      label.style.cssText = `top:${b.y + 8}px;left:${b.x + 8}px`;
    } else {
      label.style.cssText = `top:${b.y + 8}px;left:${b.x + 8}px`;
    }
    label.textContent = b.name;
    label.style.borderColor = b.color + '40';
    lanesLayer.appendChild(label);
  });
}

function computeLaneBands() {
  const ct = state.canvasType;
  const lanes = state.lanes;

  if (ct === 'matrix2x2') {
    const halfW = WORLD_W / 2, halfH = WORLD_H / 2;
    const cols = [
      { name: 'High Impact / Low Effort', x: 0, y: 0, w: halfW, h: halfH, color: '#34c759' },
      { name: 'High Impact / High Effort', x: halfW, y: 0, w: halfW, h: halfH, color: '#0a84ff' },
      { name: 'Low Impact / Low Effort', x: 0, y: halfH, w: halfW, h: halfH, color: '#8e8e93' },
      { name: 'Low Impact / High Effort', x: halfW, y: halfH, w: halfW, h: halfH, color: '#ff3b30' },
    ];
    lanes.slice(0, 4).forEach((l, i) => { cols[i].name = l.name; if (l.color) cols[i].color = l.color; });
    return cols;
  }

  if (ct === 'raci') {
    const colW = WORLD_W / 4;
    const cols = [
      { name: 'Responsible', x: 0, y: 0, w: colW, h: WORLD_H, color: '#0a84ff' },
      { name: 'Accountable', x: colW, y: 0, w: colW, h: WORLD_H, color: '#ff3b30' },
      { name: 'Consulted', x: 2 * colW, y: 0, w: colW, h: WORLD_H, color: '#ff9500' },
      { name: 'Informed', x: 3 * colW, y: 0, w: colW, h: WORLD_H, color: '#34c759' },
    ];
    lanes.slice(0, 4).forEach((l, i) => { cols[i].name = l.name; if (l.color) cols[i].color = l.color; });
    return cols;
  }

  if (ct === 'strategy') {
    const headerH = 260;
    const colW = WORLD_W / 3;
    const bands = [
      { name: 'Vision & Objectives', x: 0, y: 0, w: WORLD_W, h: headerH, color: '#5856d6' },
      { name: '3 Months (Now)', x: 0, y: headerH, w: colW, h: WORLD_H - headerH, color: '#34c759' },
      { name: '6 Months (Next)', x: colW, y: headerH, w: colW, h: WORLD_H - headerH, color: '#ff9500' },
      { name: '12 Months (Later)', x: 2 * colW, y: headerH, w: colW, h: WORLD_H - headerH, color: '#0a84ff' },
    ];
    lanes.slice(0, 4).forEach((l, i) => { bands[i].name = l.name; if (l.color) bands[i].color = l.color; });
    return bands;
  }

  if (ct === 'backcast') {
    const headerH = 140;
    const cols = 5;
    const colW = WORLD_W / cols;
    const bodyY = headerH, bodyH = WORLD_H - headerH;
    const bands = [
      { name: 'Future State Vision (12–24 months)', x: 0, y: 0, w: WORLD_W, h: headerH, color: '#ff2d55' },
      { name: 'Today (Starting Point)', x: 0 * colW, y: bodyY, w: colW, h: bodyH, color: '#8e8e93' },
      { name: 'Enablers & Guardrails', x: 1 * colW, y: bodyY, w: colW, h: bodyH, color: '#5856d6' },
      { name: 'Signals & Evidence', x: 2 * colW, y: bodyY, w: colW, h: bodyH, color: '#0a84ff' },
      { name: 'What Had To Be True', x: 3 * colW, y: bodyY, w: colW, h: bodyH, color: '#ff9500' },
      { name: 'Future Outcome', x: 4 * colW, y: bodyY, w: colW, h: bodyH, color: '#ff2d55' },
    ];
    lanes.slice(0, 6).forEach((l, i) => { bands[i].name = l.name; if (l.color) bands[i].color = l.color; });
    return bands;
  }

  if (ct === 'usecase') {
    const headerH = 150;
    const cols = 5;
    const colW = WORLD_W / cols;
    const bodyY = headerH, bodyH = WORLD_H - headerH;
    const bands = [
      { name: 'Actor / Persona — Who benefits', x: 0, y: 0, w: WORLD_W, h: headerH, color: '#5856d6' },
      { name: 'Trigger / Situation', x: 0 * colW, y: bodyY, w: colW, h: bodyH, color: '#0a84ff' },
      { name: 'Job to Be Done', x: 1 * colW, y: bodyY, w: colW, h: bodyH, color: '#34c759' },
      { name: 'Use Case Idea', x: 2 * colW, y: bodyY, w: colW, h: bodyH, color: '#ff9500' },
      { name: 'Value & Outcome', x: 3 * colW, y: bodyY, w: colW, h: bodyH, color: '#ff2d55' },
      { name: 'Feasibility & Risk', x: 4 * colW, y: bodyY, w: colW, h: bodyH, color: '#8e8e93' },
    ];
    lanes.slice(0, 6).forEach((l, i) => { bands[i].name = l.name; if (l.color) bands[i].color = l.color; });
    return bands;
  }

  if (ct === 'plan') {
    const headerH = 140;
    const colW = WORLD_W / 3;
    const bodyY = headerH, bodyH = WORLD_H - headerH;
    const bands = [
      { name: 'Plan on a Page — Objectives → Initiatives → Horizons', x: 0, y: 0, w: WORLD_W, h: headerH, color: '#34c759' },
      { name: 'Now (0–3 months)', x: 0 * colW, y: bodyY, w: colW, h: bodyH, color: '#34c759', horizon: 'now' },
      { name: 'Next (3–6 months)', x: 1 * colW, y: bodyY, w: colW, h: bodyH, color: '#ff9500', horizon: 'next' },
      { name: 'Later (6–12 months)', x: 2 * colW, y: bodyY, w: colW, h: bodyH, color: '#0a84ff', horizon: 'later' },
    ];
    lanes.slice(0, 4).forEach((l, i) => { bands[i].name = l.name; if (l.color) bands[i].color = l.color; });
    return bands;
  }

  if (ct === 'cluster' || ct === 'objectives' || ct === 'initiatives') {
    const headerH = 90;
    const label = ct === 'cluster'
      ? 'Cluster & Group — drop stickies into group frames'
      : ct === 'objectives'
        ? 'Objectives — turn each group into a clear outcome statement'
        : 'Initiatives — under each objective, define what we will actually do';
    const color = ct === 'cluster' ? '#0a84ff' : ct === 'objectives' ? '#5856d6' : '#ff9500';
    const bands = [{ name: label, x: 0, y: 0, w: WORLD_W, h: headerH, color }];
    if (lanes.length) {
      lanes.forEach(ensureLaneDefaults);
      let vCursor = 0;
      lanes.forEach(l => {
        if (l.orientation === 'v') {
          bands.push({ laneId: l.id, orientation: 'v', name: l.name, color: l.color, x: vCursor, y: headerH, w: l.size, h: WORLD_H - headerH });
          vCursor += l.size;
        }
      });
    }
    return bands;
  }

  if (!lanes.length) return [];
  lanes.forEach(ensureLaneDefaults);
  const bands = [];
  let hCursor = 0, vCursor = 0;
  lanes.forEach(l => {
    if (l.orientation === 'v') {
      bands.push({ laneId: l.id, orientation: 'v', name: l.name, color: l.color, x: vCursor, y: 0, w: l.size, h: WORLD_H });
      vCursor += l.size;
    } else {
      bands.push({ laneId: l.id, orientation: 'h', name: l.name, color: l.color, x: 0, y: hCursor, w: WORLD_W, h: l.size });
      hCursor += l.size;
    }
  });
  return bands;
}

// ============ Prompts ============
export function renderPrompts() {
  const el = $('#prompts');
  el.innerHTML = '';
  if (!state.prompts.length) {
    el.innerHTML = '<div class="empty" style="padding:0">No prompts loaded. Import JSON or load the sample.</div>';
    return;
  }
  state.prompts.forEach(p => {
    const c = document.createElement('div');
    c.className = 'prompt-card';
    c.draggable = true;
    c.innerHTML = `
      ${p.category ? `<div class="prompt-cat">${escapeHtml(p.category)}</div>` : ''}
      <div class="prompt-text">${escapeHtml(p.text)}</div>
      <button class="prompt-info" title="Open in spotlight" aria-label="Open in spotlight">↗</button>
    `;
    c.addEventListener('dragstart', e => {
      const dragText = (p.activity && p.activity.prompt) ? p.activity.prompt : p.text;
      const cat = p.category || (p.activity && p.activity.activityType) || '';
      e.dataTransfer.setData('application/x-prompt', dragText);
      e.dataTransfer.setData('application/x-card-type', 'prompt');
      if (cat) e.dataTransfer.setData('application/x-prompt-category', cat);
      e.dataTransfer.effectAllowed = 'copy';
    });
    c.addEventListener('click', ev => {
      if (ev.target.closest('.prompt-info')) return;
      if (window.__openSpotlight) window.__openSpotlight(p);
    });
    const info = c.querySelector('.prompt-info');
    if (info) {
      info.addEventListener('click', ev => { ev.stopPropagation(); if (window.__openSpotlight) window.__openSpotlight(p); });
      info.addEventListener('mousedown', ev => ev.stopPropagation());
    }
    c.addEventListener('dblclick', () => { if (window.__openSpotlight) window.__openSpotlight(p); });
    el.appendChild(c);
  });
}

// ============ Cards ============
export function isCardHidden(c) {
  if (c.type !== 'painscore') return false;
  const parent = state.cards.find(x => x.id === c.painParentId);
  return !!(parent && parent.painScoreHidden);
}

export function renderCards() {
  cardsLayer.innerHTML = '';
  state.cards.forEach(c => { if (!isCardHidden(c)) cardsLayer.appendChild(buildCardEl(c)); });
  renderConnections();
}

export function getCardEl(id) { return cardsLayer.querySelector(`.card[data-id="${id}"]`); }

export function getCardSize(c) {
  const el = getCardEl(c.id);
  if (!el) return { w: CARD_TYPES[c.type]?.defaults.w || 160, h: CARD_TYPES[c.type]?.defaults.h || 80 };
  const b = el.querySelector('.card-body').getBoundingClientRect();
  return { w: b.width / state.view.scale, h: b.height / state.view.scale };
}

export function anchorPoint(card, pos) {
  const s = getCardSize(card);
  const cx = card.x + s.w / 2, cy = card.y + s.h / 2;
  switch (pos) {
    case 'top': return { x: cx, y: card.y };
    case 'bottom': return { x: cx, y: card.y + s.h };
    case 'left': return { x: card.x, y: cy };
    case 'right': return { x: card.x + s.w, y: cy };
  }
  return { x: cx, y: cy };
}

export function hitTestGroup(c) {
  const size = getCardSize(c);
  const cx = c.x + (size.w || 160) / 2;
  const cy = c.y + (size.h || 80) / 2;
  const groups = state.cards.filter(g => g.type === 'group');
  let best = null, bestArea = Infinity;
  for (const g of groups) {
    const gw = g.w || 340, gh = g.h || 220;
    if (cx >= g.x && cx <= g.x + gw && cy >= g.y && cy <= g.y + gh) {
      const area = gw * gh;
      if (area < bestArea) { best = g.id; bestArea = area; }
    }
  }
  return best;
}

function buildCardEl(c) {
  const def = CARD_TYPES[c.type] || CARD_TYPES.sticky;
  const isText = ['sticky', 'note', 'quote', 'pain', 'gain', 'moment', 'persona', 'prompt'].includes(c.type);
  const isShape = ['process', 'decision', 'terminator', 'data', 'circle', 'delay', 'handoff', 'exception', 'parallel'].includes(c.type);
  const el = document.createElement('div');
  el.className = `card ${c.type} ${isShape ? 'shape' : ''}`;
  el.dataset.id = c.id;
  el.style.left = c.x + 'px';
  el.style.top = c.y + 'px';
  if (state.selection.cardId === c.id) el.classList.add('selected');

  const tools = document.createElement('div');
  tools.className = 'card-tools';
  const canBePain = !['prompt', 'title', 'painscore', 'group', 'objective', 'initiative'].includes(c.type);
  const painBtn = canBePain
    ? `<button data-act="pain" class="pain-toggle${c.painPoint ? ' on' : ''}" title="${c.painPoint ? 'Remove pain point' : 'Mark as pain point'}">!</button>`
    : '';
  tools.innerHTML = `${painBtn}<button data-act="edit" title="Edit">✎</button><button data-act="dup" title="Duplicate">⧉</button><button data-act="del" class="danger" title="Delete">✕</button>`;
  el.appendChild(tools);

  if (c.painPoint && c.type !== 'painscore') {
    const flag = document.createElement('div');
    flag.className = 'pain-flag';
    let totalLabel = '';
    if (c.painScoreId) {
      const sc = state.cards.find(x => x.id === c.painScoreId);
      if (sc && sc.scores) {
        const t = (sc.scores.frequency || 0) + (sc.scores.impact || 0) + (sc.scores.population || 0);
        if (t > 0) totalLabel = ` · ${t}`;
      }
    }
    const hidden = !!c.painScoreHidden;
    flag.title = hidden ? 'Show pain score' : 'Hide pain score';
    flag.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 L22 21 L2 21 Z" fill="#fff"/><rect x="11" y="9" width="2" height="6" fill="#e0392c"/><rect x="11" y="16.5" width="2" height="2" fill="#e0392c"/></svg><span>Pain${totalLabel}</span>`;
    flag.addEventListener('mousedown', e => e.stopPropagation());
    flag.addEventListener('click', e => {
      e.stopPropagation();
      c.painScoreHidden = !c.painScoreHidden;
      renderCards(); renderConnections(); save();
    });
    el.appendChild(flag);
  }

  const body = document.createElement('div');
  body.className = 'card-body';
  if (c.type === 'painscore') {
    const s = c.scores || { frequency: 0, impact: 0, population: 0 };
    const total = (s.frequency || 0) + (s.impact || 0) + (s.population || 0);
    const sev = total >= 7 ? 3 : total >= 4 ? 2 : total >= 1 ? 1 : 0;
    const row = (key, label, hint) => {
      const v = s[key] || 0;
      const dots = [1, 2, 3].map(n => `<div class="ps-dot${n <= v ? ' filled' : ''}" data-ps-key="${key}" data-ps-val="${n}"></div>`).join('');
      return `<div class="ps-row"><div class="ps-label">${label}<small>${hint}</small></div><div class="ps-dots">${dots}</div></div>`;
    };
    body.innerHTML = `
      <div class="ps-head">
        <div class="ps-title">⚑ Pain Score</div>
        <div class="ps-total${sev ? ' sev-' + sev : ''}">${total || '–'}</div>
      </div>
      ${row('frequency', 'Frequency', '1 occasional · 3 all the time')}
      ${row('impact', 'Impact', '1 minimal · 3 team/org/customer')}
      ${row('population', 'Population', '1 single user · 3 many users')}
    `;
  } else if (c.type === 'emotion') {
    body.innerHTML = `<div class="emoji">${escapeHtml(c.emoji || '😊')}</div><div class="txt">${escapeHtml(c.text || '')}</div>`;
  } else if (c.type === 'title') {
    body.innerHTML = `<div class="title-main">${escapeHtml(c.text || 'Untitled')}</div>${c.subtitle ? `<div class="title-sub">${escapeHtml(c.subtitle)}</div>` : ''}`;
  } else if (c.type === 'decision') {
    body.innerHTML = `<div class="txt">${escapeHtml(c.text)}</div>`;
  } else if (c.type === 'prompt') {
    body.innerHTML = `${c.category ? `<div class="prompt-tag">${escapeHtml(c.category)}</div>` : ''}<div class="prompt-text">${escapeHtml(c.text)}</div>`;
    if (c.w) body.style.width = c.w + 'px';
    if (c.h) body.style.minHeight = c.h + 'px';
  } else if (c.type === 'group') {
    const color = c.color || '#0a84ff';
    body.style.setProperty('--group-color', color);
    const w = c.w || 340, h = c.h || 220;
    body.style.width = w + 'px';
    body.style.height = h + 'px';
    const memberCount = state.cards.filter(x => x.groupId === c.id).length;
    body.innerHTML = `<div class="group-head"><span>${escapeHtml(c.text || 'Group')}</span><span class="group-count">${memberCount}</span></div><div class="group-resize" data-group-resize></div>`;
  } else if (c.type === 'objective') {
    const promoted = !!c.promoted;
    body.innerHTML = `
      <div class="obj-title">${escapeHtml(c.text || 'Objective')}</div>
      <div class="obj-row"><span class="obj-lbl">Why</span><span class="obj-val">${escapeHtml(c.why || '—')}</span></div>
      <div class="obj-row"><span class="obj-lbl">Measure</span><span class="obj-val">${escapeHtml(c.measure || '—')}</span></div>
      <div class="obj-promote${promoted ? ' on' : ''}" data-obj-promote>${promoted ? '✓ Promoted to plan' : 'Promote to plan'}</div>
    `;
  } else if (c.type === 'initiative') {
    const eff = c.effort || 'M';
    const imp = c.impact || 3;
    body.innerHTML = `
      <div class="ini-name">${escapeHtml(c.text || 'Initiative')}</div>
      <div class="ini-hyp">${escapeHtml(c.hypothesis || '')}</div>
      <div class="ini-tags">
        ${c.owner ? `<span class="ini-tag owner">👤 ${escapeHtml(c.owner)}</span>` : ''}
        <span class="ini-tag">Effort ${escapeHtml(eff)}</span>
        <span class="ini-tag impact">Impact ${imp}/5</span>
      </div>
    `;
  } else if (isText) {
    body.textContent = c.text;
    body.style.whiteSpace = 'pre-wrap';
  } else {
    body.innerHTML = `<div class="txt">${escapeHtml(c.text)}</div>`;
  }
  if (c.color && (c.type === 'sticky')) body.style.background = c.color;
  el.appendChild(body);

  if (c.type === 'prompt') {
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.addEventListener('mousedown', e => { e.stopPropagation(); if (window.__startResize) window.__startResize(c.id, e); });
    el.appendChild(handle);
  }
  if (c.type === 'group') {
    const gh = body.querySelector('[data-group-resize]');
    if (gh) gh.addEventListener('mousedown', e => { e.stopPropagation(); if (window.__startGroupResize) window.__startGroupResize(c.id, e); });
  }
  if (c.type === 'objective') {
    const p = body.querySelector('[data-obj-promote]');
    if (p) p.addEventListener('click', e => { e.stopPropagation(); c.promoted = !c.promoted; renderCards(); save(); });
    if (p) p.addEventListener('mousedown', e => e.stopPropagation());
  }

  ['top', 'right', 'bottom', 'left'].forEach(pos => {
    const a = document.createElement('div');
    a.className = 'anchor ' + pos;
    a.dataset.anchor = pos;
    el.appendChild(a);
  });

  return el;
}

// ============ Connections ============
export function renderConnections() {
  connLayer.innerHTML = `
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#8e8e93"/>
      </marker>
      <marker id="arrowSel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill="#0071e3"/>
      </marker>
    </defs>
  `;
  state.connections.forEach(conn => {
    const from = state.cards.find(c => c.id === conn.from);
    const to = state.cards.find(c => c.id === conn.to);
    if (!from || !to) return;
    if (isCardHidden(from) || isCardHidden(to)) return;
    const p1 = anchorPoint(from, conn.fromAnchor || 'right');
    const p2 = anchorPoint(to, conn.toAnchor || 'left');
    const d = curvePath(p1, p2, conn.fromAnchor, conn.toAnchor);
    const sel = state.selection.connId === conn.id;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hit.setAttribute('d', d); hit.setAttribute('class', 'conn-hit');
    hit.addEventListener('click', e => { e.stopPropagation(); selectConn(conn.id); });
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', d);
    line.setAttribute('class', 'conn-line' + (sel ? ' selected' : ''));
    line.setAttribute('marker-end', sel ? 'url(#arrowSel)' : 'url(#arrow)');
    g.appendChild(hit); g.appendChild(line);
    connLayer.appendChild(g);
  });
}

export function curvePath(p1, p2, a1, a2) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const dist = Math.max(40, Math.hypot(dx, dy) * 0.4);
  const horiz = a => a === 'left' || a === 'right';
  const off = (a, sign) => horiz(a) ? { x: sign * dist, y: 0 } : { x: 0, y: sign * dist };
  const s1 = (a1 === 'right' || a1 === 'bottom') ? 1 : -1;
  const s2 = (a2 === 'right' || a2 === 'bottom') ? 1 : -1;
  const c1 = off(a1 || 'right', s1);
  const c2 = off(a2 || 'left', s2);
  return `M ${p1.x} ${p1.y} C ${p1.x + c1.x} ${p1.y + c1.y}, ${p2.x + c2.x} ${p2.y + c2.y}, ${p2.x} ${p2.y}`;
}

// ============ Selection ============
export function selectCard(id) {
  state.selection = { cardId: id, connId: null };
  cardsLayer.querySelectorAll('.card').forEach(el => el.classList.toggle('selected', el.dataset.id === id));
  renderConnections();
  applyCanvasTheme();
}

export function selectConn(id) {
  state.selection = { cardId: null, connId: id };
  cardsLayer.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
  renderConnections();
  applyCanvasTheme();
}

export function clearSelection() {
  state.selection = { cardId: null, connId: null };
  cardsLayer.querySelectorAll('.card').forEach(el => el.classList.remove('selected'));
  renderConnections();
  applyCanvasTheme();
}

// ============ Card operations ============
export function addCard(partial) {
  const c = {
    id: uid(),
    type: partial.type || 'sticky',
    x: partial.x ?? 200,
    y: partial.y ?? 200,
    text: partial.text ?? 'New idea',
    color: partial.color,
    category: partial.category,
    w: partial.w,
    h: partial.h,
    emoji: partial.emoji,
    subtitle: partial.subtitle,
    painPoint: partial.painPoint,
    painScoreId: partial.painScoreId,
    painParentId: partial.painParentId,
    scores: partial.scores,
  };
  state.cards.push(c);
  renderCards();
  selectCard(c.id);
  save();
}

export function deleteCard(id) {
  const c = state.cards.find(x => x.id === id);
  const cascade = new Set([id]);
  if (c) {
    if (c.painScoreId) cascade.add(c.painScoreId);
    if (c.type === 'painscore' && c.painParentId) {
      const parent = state.cards.find(x => x.id === c.painParentId);
      if (parent) { parent.painPoint = false; parent.painScoreId = undefined; }
    }
  }
  state.cards = state.cards.filter(c => !cascade.has(c.id));
  state.connections = state.connections.filter(cn => !cascade.has(cn.from) && !cascade.has(cn.to));
  if (cascade.has(state.selection.cardId)) state.selection.cardId = null;
  renderCards(); save();
}

export function togglePainPoint(id) {
  const c = state.cards.find(x => x.id === id);
  if (!c) return;
  if (c.painPoint) {
    const linkedId = c.painScoreId;
    c.painPoint = false;
    c.painScoreId = undefined;
    if (linkedId) {
      state.cards = state.cards.filter(x => x.id !== linkedId);
      state.connections = state.connections.filter(cn => cn.from !== linkedId && cn.to !== linkedId);
    }
  } else {
    c.painPoint = true;
    const size = getCardSize(c);
    const scoreId = uid();
    const sx = c.x + size.w + 40;
    const sy = c.y - 10;
    state.cards.push({
      id: scoreId, type: 'painscore', x: sx, y: sy,
      painParentId: c.id,
      scores: { frequency: 0, impact: 0, population: 0 },
    });
    state.connections.push({
      id: 'c' + Date.now() + Math.random().toString(36).slice(2, 6),
      from: c.id, to: scoreId, fromAnchor: 'right', toAnchor: 'left'
    });
    c.painScoreId = scoreId;
  }
  renderCards(); renderConnections(); save();
}

export function addMindmapChild(parentId) {
  const parent = state.cards.find(c => c.id === parentId);
  if (!parent) return;
  const cx = WORLD_W / 2, cy = WORLD_H / 2;
  const kidCount = state.connections.filter(c => c.from === parentId).length;
  const baseAngle = Math.atan2((parent.y + 70) - cy, (parent.x + 100) - cx);
  const spread = (kidCount % 2 === 0 ? 1 : -1) * (Math.ceil(kidCount / 2) * 0.55);
  const angle = baseAngle + spread;
  const dist = 220;
  const nx = (parent.x + 100) + Math.cos(angle) * dist - 100;
  const ny = (parent.y + 40) + Math.sin(angle) * dist - 30;
  const child = { id: uid(), type: 'sticky', text: 'New branch', x: nx, y: ny };
  state.cards.push(child);
  state.connections.push({ id: uid(), from: parentId, to: child.id, fromSide: 'auto', toSide: 'auto' });
  renderCards(); renderConnections(); selectCard(child.id); save();
}

// ============ Fit to view ============
export function fitToView() {
  if (!state.cards.length) { state.view = { x: 40, y: 40, scale: .8 }; applyView(); return; }
  const xs = state.cards.map(c => c.x), ys = state.cards.map(c => c.y);
  const xe = state.cards.map(c => c.x + getCardSize(c).w), ye = state.cards.map(c => c.y + getCardSize(c).h);
  const minX = Math.min(...xs), minY = Math.min(...ys), maxX = Math.max(...xe), maxY = Math.max(...ye);
  const r = viewport.getBoundingClientRect();
  const pad = 60;
  const s = Math.min((r.width - pad * 2) / (maxX - minX), (r.height - pad * 2) / (maxY - minY), 1.5);
  state.view.scale = Math.max(.2, s);
  state.view.x = pad - minX * state.view.scale;
  state.view.y = pad - minY * state.view.scale;
  applyView();
}

// ============ Render all ============
export function renderAll() {
  applyView();
  applyCanvasTheme();
  if (window.__renderStageBar) window.__renderStageBar();
  renderPalette();
  renderLanes();
  renderLanesLayer();
  renderPrompts();
  renderCards();
}
