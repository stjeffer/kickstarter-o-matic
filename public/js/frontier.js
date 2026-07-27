// Frontier Action Plan — data-driven 5-step workshop mode.
// Everything (prompts, pillars, grounding, banks, probes) comes from an
// imported Workshop JSON. Nothing customer-specific is hardcoded.

const LS_KEY = 'frontier-workshop-v1';
const HORIZONS = ['0-3m', '3-6m', '6-12m'];

// -------- state --------
let ws = null;           // current Workshop object
let activeStepId = null; // which step is open
let groundingOpen = true;

// -------- helpers --------
const uid = (p = 'id') => p + '-' + Math.random().toString(36).slice(2, 9);
const nowIso = () => new Date().toISOString();
const kebab = (s) => (s || 'workshop').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function emptyWorkshop() {
  return {
    meta: { customer: '', workshop: 'Frontier Action Plan', scope: '', generatedDate: '', facilitator: '', groundingNote: '', schemaVersion: '1.0' },
    pillars: [],
    steps: [],
    clusters: [],
    initiatives: [],
    visionStatement: '',
    grounding: { confirmed: [], validate: [], sources: [] },
  };
}

function normaliseWorkshop(raw) {
  // Accept either a wrapped { meta: {...} } shape or the flat sample shape.
  const w = emptyWorkshop();
  const flatMeta = ('customer' in raw || 'workshop' in raw || 'scope' in raw) && !raw.meta;
  const metaSrc = flatMeta
    ? { customer: raw.customer, workshop: raw.workshop, scope: raw.scope, generatedDate: raw.generatedDate, facilitator: raw.facilitator, groundingNote: raw.groundingNote, schemaVersion: raw.schemaVersion || '1.0' }
    : (raw.meta || {});
  w.meta = { ...w.meta, ...metaSrc };
  w.pillars = Array.isArray(raw.pillars) ? raw.pillars : [];
  w.steps = (Array.isArray(raw.steps) ? raw.steps : []).map(s => ({
    id: s.id || uid('step'),
    sequence: s.sequence ?? 0,
    title: s.title || 'Untitled step',
    type: s.type || 'future-state-prompt',
    timeboxMins: s.timeboxMins || 0,
    prompt: s.prompt || '',
    guidance: s.guidance || '',
    capture: s.capture || '',
    promptBanks: s.promptBanks || [],
    frontierProbes: s.frontierProbes || [],
    fields: s.fields || [],
    responses: Array.isArray(s.responses) ? s.responses : [],
  })).sort((a, b) => a.sequence - b.sequence);
  w.clusters = Array.isArray(raw.clusters) ? raw.clusters : [];
  w.initiatives = Array.isArray(raw.initiatives) ? raw.initiatives : [];
  w.visionStatement = raw.visionStatement || '';
  w.grounding = {
    confirmed: raw.grounding?.confirmed || [],
    validate: raw.grounding?.validate || [],
    sources: raw.grounding?.sources || [],
  };
  return w;
}

function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ ws, activeStepId })); } catch {}
}
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    ws = data.ws;
    activeStepId = data.activeStepId || ws?.steps?.[0]?.id || null;
    return !!ws;
  } catch { return false; }
}

// -------- collect notes across steps (for cluster/prioritise) --------
function allResponses() {
  const out = [];
  for (const s of ws.steps) for (const r of s.responses) out.push({ ...r, stepId: s.id, stepTitle: s.title });
  return out;
}

// -------- overlay lifecycle --------
export function openFrontier(seed) {
  if (seed) { ws = normaliseWorkshop(seed); activeStepId = ws.steps[0]?.id || null; save(); }
  else if (!ws) { if (!load()) { ws = emptyWorkshop(); activeStepId = null; } }
  if (!document.getElementById('frontierApp')) injectShell();
  document.getElementById('frontierApp').hidden = false;
  document.body.classList.add('frontier-open');
  render();
}
export function closeFrontier() {
  const el = document.getElementById('frontierApp');
  if (el) el.hidden = true;
  document.body.classList.remove('frontier-open');
}

function injectShell() {
  const style = document.createElement('style');
  style.textContent = frontierCss();
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'frontierApp';
  el.hidden = true;
  el.innerHTML = shellHtml();
  document.body.appendChild(el);

  wireShell(el);
}

function shellHtml() {
  return `
    <header class="fr-top">
      <div class="fr-brand">
        <div class="fr-logo"></div>
        <div class="fr-brand-text">
          <div class="fr-brand-title">Frontier Action Plan</div>
          <div class="fr-brand-sub" id="frMetaLine">No workshop loaded</div>
        </div>
      </div>
      <div class="fr-actions">
        <button class="fr-btn" id="frNew">New</button>
        <button class="fr-btn" id="frImport">Import JSON</button>
        <button class="fr-btn primary" id="frExport">Export JSON</button>
        <button class="fr-btn ghost" id="frExit" title="Back to canvas">Exit</button>
      </div>
    </header>
    <div class="fr-body" id="frBody">
      <aside class="fr-rail" id="frRail"></aside>
      <main class="fr-main" id="frMain"></main>
      <aside class="fr-grounding" id="frGrounding"></aside>
    </div>
    <input type="file" id="frFile" accept="application/json,.json" hidden />
  `;
}

function wireShell(el) {
  el.querySelector('#frExit').onclick = () => closeFrontier();
  el.querySelector('#frNew').onclick = () => {
    if (!confirm('Start a new blank workshop? Unsaved changes will be lost.')) return;
    ws = emptyWorkshop(); activeStepId = null; save(); render();
  };
  el.querySelector('#frImport').onclick = () => el.querySelector('#frFile').click();
  el.querySelector('#frFile').onchange = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const raw = JSON.parse(await f.text());
      ws = normaliseWorkshop(raw);
      activeStepId = ws.steps[0]?.id || null;
      save(); render();
    } catch (err) { alert('Could not parse JSON: ' + err.message); }
    e.target.value = '';
  };
  el.querySelector('#frExport').onclick = () => {
    const name = kebab(ws?.meta?.customer) + '-frontier-action-plan.json';
    const blob = new Blob([JSON.stringify(ws, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
}

// -------- render --------
function render() {
  const app = document.getElementById('frontierApp');
  if (!app) return;
  const m = ws.meta || {};
  const metaBits = [m.customer, m.scope].filter(Boolean).join(' · ');
  app.querySelector('#frMetaLine').textContent = metaBits || 'No workshop loaded — Import a JSON to begin';
  const loaded = !!(ws && ws.steps && ws.steps.length);
  app.querySelector('#frBody').classList.toggle('empty', !loaded);
  renderRail();
  renderMain();
  renderGrounding();
}


function renderRail() {
  const rail = document.getElementById('frRail');
  if (!ws.steps.length) {
    rail.innerHTML = `<div class="fr-empty">No steps yet.<br/>Import a workshop JSON to begin.</div>`;
    return;
  }
  rail.innerHTML = `
    <div class="fr-rail-hd">Workshop steps</div>
    <ol class="fr-steps">
      ${ws.steps.map((s, i) => `
        <li class="fr-step ${s.id === activeStepId ? 'active' : ''}" data-id="${s.id}">
          <div class="fr-step-num">${s.sequence || i + 1}</div>
          <div class="fr-step-body">
            <div class="fr-step-title">${esc(s.title)}</div>
            <div class="fr-step-meta">${s.timeboxMins ? s.timeboxMins + ' min' : ''} · <span class="fr-step-type">${esc(s.type)}</span></div>
          </div>
        </li>
      `).join('')}
    </ol>
  `;
  rail.querySelectorAll('.fr-step').forEach(li => {
    li.onclick = () => { activeStepId = li.dataset.id; save(); render(); };
  });
}

function currentStep() { return ws.steps.find(s => s.id === activeStepId) || null; }
function currentIdx() { return ws.steps.findIndex(s => s.id === activeStepId); }

function renderMain() {
  const main = document.getElementById('frMain');
  const s = currentStep();
  if (!s) {
    main.innerHTML = `
      <div class="fr-blank">
        <h2>Frontier Action Plan</h2>
        <p>Import a customer workshop JSON to load the five-step flow. Everything on screen — prompts, pillars, prompt banks, frontier probes and grounding — is defined in the file.</p>
        <button class="fr-btn primary" onclick="document.getElementById('frImport').click()">Import JSON</button>
      </div>`;
    return;
  }
  const idx = currentIdx();
  const prev = ws.steps[idx - 1];
  const next = ws.steps[idx + 1];

  const header = `
    <div class="fr-step-hd">
      <div class="fr-step-hd-top">
        <div class="fr-step-chip">Step ${s.sequence || idx + 1} · ${esc(s.type)}${s.timeboxMins ? ' · ' + s.timeboxMins + ' min' : ''}</div>
        <div class="fr-nav">
          ${prev ? `<button class="fr-btn ghost" data-nav="${prev.id}">← ${esc(prev.title)}</button>` : ''}
          ${next ? `<button class="fr-btn" data-nav="${next.id}">${esc(next.title)} →</button>` : ''}
        </div>
      </div>
      <h1>${esc(s.title)}</h1>
      ${s.prompt ? `<p class="fr-prompt">${esc(s.prompt)}</p>` : ''}
      ${s.guidance ? `<p class="fr-guidance"><strong>Guidance:</strong> ${esc(s.guidance)}</p>` : ''}
      ${s.capture ? `<p class="fr-capture">Capturing: <em>${esc(s.capture)}</em></p>` : ''}
    </div>
  `;

  let body = '';
  switch (s.type) {
    case 'future-state-prompt': body = renderFutureState(s); break;
    case 'elicitation':         body = renderElicitation(s); break;
    case 'cluster-prioritise':  body = renderCluster(s); break;
    case 'initiatives':         body = renderInitiatives(s); break;
    case 'vision-synthesis':    body = renderVision(s); break;
    default: body = `<div class="fr-empty">Unknown step type: ${esc(s.type)}</div>`;
  }
  main.innerHTML = header + `<div class="fr-step-body-wrap">${body}</div>`;

  main.querySelectorAll('[data-nav]').forEach(b => {
    b.onclick = () => { activeStepId = b.dataset.nav; save(); render(); };
  });
  wireStep(s);
}

// -------- STEP: future-state-prompt --------
function renderFutureState(s) {
  return `
    <div class="fr-notes-hd">
      <div class="fr-notes-count">${s.responses.length} note${s.responses.length === 1 ? '' : 's'}</div>
      <div class="fr-notes-add">
        <input type="text" id="frNoteInput" placeholder="What's different in the future? (press Enter)" />
        <button class="fr-btn" id="frNoteAdd">Add note</button>
      </div>
    </div>
    <div class="fr-notes">
      ${s.responses.map(r => noteHtml(r)).join('') || `<div class="fr-empty small">No notes yet — start capturing what's different.</div>`}
    </div>
  `;
}
function noteHtml(r, extra = '') {
  const pillar = r.pillar ? `<span class="fr-tag pillar-${esc(r.pillar)}">${esc(r.pillar)}</span>` : '';
  const enabled = r.enabledBy ? `<div class="fr-note-enabled"><span class="lbl">Enabled by</span>${esc(r.enabledBy)}</div>` : '';
  return `
    <div class="fr-note" data-id="${r.id}" contenteditable="false">
      <div class="fr-note-top">${pillar}${extra}<button class="fr-note-del" data-del="${r.id}" title="Delete">×</button></div>
      <div class="fr-note-text" data-edit="${r.id}" data-field="text" contenteditable="true">${esc(r.text)}</div>
      ${enabled}
    </div>
  `;
}

// -------- STEP: elicitation --------
function renderElicitation(s) {
  const probes = s.frontierProbes?.length
    ? `<div class="fr-probes"><div class="fr-probes-hd">Frontier probes</div>
        <div class="fr-probe-list">${s.frontierProbes.map(p => `<button class="fr-chip probe" title="${esc(p.prompt)}" data-probe="${esc(p.prompt)}">${esc(p.concept)}</button>`).join('')}</div>
      </div>` : '';

  const pillars = ws.pillars.length ? ws.pillars : (s.promptBanks || []).map(b => ({ id: b.pillar, label: b.pillar }));
  const banks = new Map((s.promptBanks || []).map(b => [b.pillar, b]));

  const cols = pillars.map(p => {
    const bank = banks.get(p.id) || { contextToday: '', prompts: [] };
    const notes = s.responses.filter(r => r.pillar === p.id);
    return `
      <section class="fr-col" data-pillar="${esc(p.id)}">
        <header class="fr-col-hd">
          <div class="fr-col-title">${esc(p.label || p.id)}</div>
          ${p.audience ? `<div class="fr-col-sub">${esc(p.audience)}</div>` : ''}
        </header>
        ${bank.contextToday ? `<div class="fr-context"><span class="lbl">Today</span>${esc(bank.contextToday)}</div>` : ''}
        ${bank.prompts?.length ? `<div class="fr-bank">${bank.prompts.map((pr, i) => `<button class="fr-chip" data-bank-prompt="${esc(pr)}">${esc(pr)}</button>`).join('')}</div>` : ''}
        <div class="fr-col-add">
          <input type="text" placeholder="What changed?" data-pillar-what="${esc(p.id)}" />
          <input type="text" placeholder="What enabled it?" data-pillar-enabled="${esc(p.id)}" />
          <button class="fr-btn small" data-pillar-add="${esc(p.id)}">Add pair</button>
        </div>
        <div class="fr-col-notes">
          ${notes.map(r => noteHtml(r)).join('') || `<div class="fr-empty small">No notes for this pillar yet.</div>`}
        </div>
      </section>
    `;
  }).join('');

  return probes + `<div class="fr-cols">${cols}</div>`;
}

// -------- STEP: cluster-prioritise --------
function renderCluster(s) {
  const notes = allResponses();
  const clustered = new Set(ws.clusters.flatMap(c => c.noteIds));
  const unclustered = notes.filter(n => !clustered.has(n.id));

  const matrix = `
    <div class="fr-matrix" id="frMatrix">
      <div class="fr-matrix-hd">Impact × Readiness</div>
      <div class="fr-matrix-wrap">
        <div class="fr-axis-y"><span>High impact</span><span>Low</span></div>
        <div class="fr-matrix-grid" id="frMatrixGrid">
          ${ws.clusters.map(c => {
            // impact 1-5 -> y (invert), readiness 1-5 -> x
            const x = ((c.readiness - 1) / 4) * 100;
            const y = 100 - ((c.impact - 1) / 4) * 100;
            return `<div class="fr-token" data-cluster="${c.id}" style="left:${x}%;top:${y}%" title="${esc(c.name)} — impact ${c.impact}, readiness ${c.readiness}">${esc(c.name)}</div>`;
          }).join('')}
        </div>
        <div class="fr-axis-x"><span>Low readiness</span><span>High</span></div>
      </div>
    </div>
  `;

  const clustersUi = `
    <div class="fr-clusters">
      <div class="fr-clusters-hd">
        <h3>Clusters</h3>
        <div class="fr-cluster-add">
          <input id="frClusterName" placeholder="Cluster name" />
          <button class="fr-btn small" id="frClusterAdd">Add cluster</button>
        </div>
      </div>
      ${ws.clusters.length ? ws.clusters.map(c => clusterCardHtml(c, notes)).join('') : `<div class="fr-empty small">No clusters yet.</div>`}
    </div>
  `;

  const pool = `
    <div class="fr-pool">
      <h3>Unclustered notes <span class="fr-count">${unclustered.length}</span></h3>
      <div class="fr-pool-list">
        ${unclustered.map(n => poolNoteHtml(n)).join('') || `<div class="fr-empty small">All notes are clustered.</div>`}
      </div>
    </div>
  `;

  return `<div class="fr-cluster-layout">${clustersUi}${pool}${matrix}</div>`;
}
function poolNoteHtml(n) {
  return `<div class="fr-pool-note" draggable="true" data-note="${n.id}">
    ${n.pillar ? `<span class="fr-tag pillar-${esc(n.pillar)}">${esc(n.pillar)}</span>` : ''}
    <span class="fr-pool-text">${esc(n.text)}</span>
    <span class="fr-pool-step">${esc(n.stepTitle)}</span>
  </div>`;
}
function clusterCardHtml(c, notes) {
  const members = c.noteIds.map(id => notes.find(n => n.id === id)).filter(Boolean);
  return `
    <div class="fr-cluster" data-cluster-drop="${c.id}">
      <div class="fr-cluster-top">
        <input class="fr-cluster-name" data-cluster-rename="${c.id}" value="${esc(c.name)}" />
        <button class="fr-note-del" data-cluster-del="${c.id}" title="Delete cluster">×</button>
      </div>
      <div class="fr-cluster-scores">
        <label>Impact <input type="range" min="1" max="5" value="${c.impact}" data-cluster-impact="${c.id}"/><span>${c.impact}</span></label>
        <label>Readiness <input type="range" min="1" max="5" value="${c.readiness}" data-cluster-readiness="${c.id}"/><span>${c.readiness}</span></label>
      </div>
      <div class="fr-cluster-notes">
        ${members.map(m => `<div class="fr-pool-note in-cluster" draggable="true" data-note="${m.id}">
          ${m.pillar ? `<span class="fr-tag pillar-${esc(m.pillar)}">${esc(m.pillar)}</span>` : ''}
          <span class="fr-pool-text">${esc(m.text)}</span>
          <button class="fr-note-del" data-remove-from-cluster="${c.id}|${m.id}" title="Remove">×</button>
        </div>`).join('') || `<div class="fr-empty small">Drop notes here</div>`}
      </div>
    </div>
  `;
}

// -------- STEP: initiatives --------
function renderInitiatives(s) {
  const fields = s.fields?.length ? s.fields : ['initiative','changeItDrives','owner','firstMove','successSignal','horizon'];
  if (!ws.clusters.length) {
    return `<div class="fr-empty">Add clusters in the previous step to define initiatives against.</div>`;
  }
  return `
    <div class="fr-inits">
      ${ws.clusters.map(c => {
        const inits = ws.initiatives.filter(i => i.clusterId === c.id);
        return `
          <section class="fr-init-cluster" data-cluster-inits="${c.id}">
            <header class="fr-init-hd">
              <h3>${esc(c.name)}</h3>
              <button class="fr-btn small" data-add-init="${c.id}">+ Initiative</button>
            </header>
            <div class="fr-init-cards">
              ${inits.map(i => initCardHtml(i, fields)).join('') || `<div class="fr-empty small">No initiatives yet.</div>`}
            </div>
          </section>
        `;
      }).join('')}
    </div>
  `;
}
function initCardHtml(i, fields) {
  const labels = {
    initiative:'Initiative', changeItDrives:'Change it drives', owner:'Owner',
    firstMove:'First move', successSignal:'Success signal', horizon:'Horizon'
  };
  const rows = fields.filter(f => f !== 'horizon').map(f => `
    <label class="fr-init-field">
      <span>${esc(labels[f] || f)}</span>
      <textarea rows="2" data-init="${i.id}" data-field="${esc(f)}">${esc(i[f] || '')}</textarea>
    </label>
  `).join('');
  const horizon = fields.includes('horizon') ? `
    <label class="fr-init-field">
      <span>Horizon</span>
      <select data-init="${i.id}" data-field="horizon">
        ${HORIZONS.map(h => `<option value="${h}" ${i.horizon === h ? 'selected' : ''}>${h}</option>`).join('')}
      </select>
    </label>` : '';
  return `
    <div class="fr-init-card">
      ${rows}${horizon}
      <button class="fr-note-del" data-init-del="${i.id}" title="Delete">×</button>
    </div>
  `;
}

// -------- STEP: vision-synthesis --------
function renderVision(s) {
  const topClusters = [...ws.clusters].sort((a, b) => (b.impact + b.readiness) - (a.impact + a.readiness)).slice(0, 5);
  return `
    <div class="fr-vision">
      <label class="fr-init-field big">
        <span>Vision statement</span>
        <textarea id="frVision" rows="4" placeholder="One sentence…">${esc(ws.visionStatement)}</textarea>
      </label>
      <div class="fr-recap">
        <div class="fr-recap-col">
          <h4>Pillars</h4>
          <ul>${ws.pillars.map(p => `<li><strong>${esc(p.label)}</strong>${p.audience ? ` — <em>${esc(p.audience)}</em>` : ''}</li>`).join('') || '<li class="muted">None</li>'}</ul>
        </div>
        <div class="fr-recap-col">
          <h4>Top clusters</h4>
          <ul>${topClusters.map(c => `<li>${esc(c.name)} <span class="muted">(impact ${c.impact} · readiness ${c.readiness})</span></li>`).join('') || '<li class="muted">None yet</li>'}</ul>
        </div>
        <div class="fr-recap-col">
          <h4>Initiatives</h4>
          <ul>${ws.initiatives.map(i => `<li>${esc(i.initiative || 'Untitled')} <span class="muted">(${esc(i.horizon || '—')})</span></li>`).join('') || '<li class="muted">None yet</li>'}</ul>
        </div>
      </div>
    </div>
  `;
}

// -------- wire step-specific interactions --------
function wireStep(s) {
  const main = document.getElementById('frMain');

  // shared: note delete + inline edit
  main.querySelectorAll('[data-del]').forEach(b => {
    b.onclick = () => {
      const id = b.dataset.del;
      s.responses = s.responses.filter(r => r.id !== id);
      // also strip from any cluster
      ws.clusters.forEach(c => c.noteIds = c.noteIds.filter(x => x !== id));
      save(); render();
    };
  });
  main.querySelectorAll('[data-edit]').forEach(el => {
    el.oninput = () => {
      const id = el.dataset.edit; const field = el.dataset.field;
      const r = s.responses.find(x => x.id === id);
      if (r) { r[field] = el.textContent.trim(); save(); }
    };
  });

  if (s.type === 'future-state-prompt') {
    const inp = main.querySelector('#frNoteInput');
    const add = () => {
      const text = inp.value.trim(); if (!text) return;
      s.responses.push({ id: uid('note'), text, pillar: null, enabledBy: null, author: null, createdAt: nowIso() });
      inp.value = ''; save(); render();
    };
    main.querySelector('#frNoteAdd').onclick = add;
    inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } };
    inp.focus();
  }

  if (s.type === 'elicitation') {
    // clicking a bank/probe chip drops the prompt text into the "what changed" input for that pillar
    main.querySelectorAll('[data-bank-prompt]').forEach(btn => {
      btn.onclick = () => {
        const col = btn.closest('.fr-col');
        const inp = col.querySelector('[data-pillar-what]');
        inp.value = btn.dataset.bankPrompt; inp.focus();
      };
    });
    main.querySelectorAll('[data-probe]').forEach(btn => {
      btn.onclick = () => {
        // Drop probe text into first empty "what changed" input
        const inputs = main.querySelectorAll('[data-pillar-what]');
        const target = [...inputs].find(i => !i.value) || inputs[0];
        if (target) { target.value = btn.dataset.probe; target.focus(); }
      };
    });
    main.querySelectorAll('[data-pillar-add]').forEach(btn => {
      btn.onclick = () => {
        const pid = btn.dataset.pillarAdd;
        const col = btn.closest('.fr-col');
        const what = col.querySelector('[data-pillar-what]').value.trim();
        const enabled = col.querySelector('[data-pillar-enabled]').value.trim();
        if (!what) return;
        s.responses.push({ id: uid('note'), text: what, pillar: pid, enabledBy: enabled || null, author: null, createdAt: nowIso() });
        save(); render();
      };
    });
  }

  if (s.type === 'cluster-prioritise') {
    // Add cluster
    const nameInp = main.querySelector('#frClusterName');
    const addC = () => {
      const name = nameInp.value.trim(); if (!name) return;
      ws.clusters.push({ id: uid('cl'), name, impact: 3, readiness: 3, priority: ws.clusters.length + 1, noteIds: [] });
      nameInp.value = ''; save(); render();
    };
    main.querySelector('#frClusterAdd').onclick = addC;
    nameInp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addC(); } };

    // Rename
    main.querySelectorAll('[data-cluster-rename]').forEach(el => {
      el.oninput = () => { const c = ws.clusters.find(x => x.id === el.dataset.clusterRename); if (c) { c.name = el.value; save(); } };
      el.onblur = () => render();
    });
    // Delete cluster
    main.querySelectorAll('[data-cluster-del]').forEach(b => {
      b.onclick = () => { ws.clusters = ws.clusters.filter(c => c.id !== b.dataset.clusterDel); ws.initiatives = ws.initiatives.filter(i => i.clusterId !== b.dataset.clusterDel); save(); render(); };
    });
    // Sliders
    main.querySelectorAll('[data-cluster-impact]').forEach(sl => {
      sl.oninput = () => { const c = ws.clusters.find(x => x.id === sl.dataset.clusterImpact); if (c) { c.impact = +sl.value; save(); render(); } };
    });
    main.querySelectorAll('[data-cluster-readiness]').forEach(sl => {
      sl.oninput = () => { const c = ws.clusters.find(x => x.id === sl.dataset.clusterReadiness); if (c) { c.readiness = +sl.value; save(); render(); } };
    });
    // Remove from cluster
    main.querySelectorAll('[data-remove-from-cluster]').forEach(b => {
      b.onclick = () => {
        const [cid, nid] = b.dataset.removeFromCluster.split('|');
        const c = ws.clusters.find(x => x.id === cid); if (!c) return;
        c.noteIds = c.noteIds.filter(x => x !== nid); save(); render();
      };
    });
    // Drag notes into clusters
    main.querySelectorAll('[data-note]').forEach(el => {
      el.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/note-id', el.dataset.note); e.dataTransfer.effectAllowed = 'move'; });
    });
    main.querySelectorAll('[data-cluster-drop]').forEach(zone => {
      zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drop-over'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('drop-over'));
      zone.addEventListener('drop', (e) => {
        e.preventDefault(); zone.classList.remove('drop-over');
        const nid = e.dataTransfer.getData('text/note-id'); if (!nid) return;
        // remove from all clusters first, then add to this one
        ws.clusters.forEach(c => c.noteIds = c.noteIds.filter(x => x !== nid));
        const c = ws.clusters.find(x => x.id === zone.dataset.clusterDrop);
        if (c && !c.noteIds.includes(nid)) c.noteIds.push(nid);
        save(); render();
      });
    });

    // Matrix token drag (position -> impact/readiness)
    const grid = main.querySelector('#frMatrixGrid');
    if (grid) {
      grid.querySelectorAll('.fr-token').forEach(tok => {
        let dragging = false;
        tok.addEventListener('mousedown', (e) => {
          dragging = true; e.preventDefault();
          const move = (ev) => {
            if (!dragging) return;
            const rect = grid.getBoundingClientRect();
            const x = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
            const y = Math.min(1, Math.max(0, (ev.clientY - rect.top) / rect.height));
            tok.style.left = (x * 100) + '%';
            tok.style.top = (y * 100) + '%';
            const c = ws.clusters.find(x2 => x2.id === tok.dataset.cluster);
            if (c) { c.readiness = Math.round(1 + x * 4); c.impact = Math.round(1 + (1 - y) * 4); }
          };
          const up = () => { dragging = false; document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); save(); render(); };
          document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
        });
      });
    }
  }

  if (s.type === 'initiatives') {
    main.querySelectorAll('[data-add-init]').forEach(b => {
      b.onclick = () => {
        ws.initiatives.push({ id: uid('init'), clusterId: b.dataset.addInit, initiative: '', changeItDrives: '', owner: '', firstMove: '', successSignal: '', horizon: '0-3m' });
        save(); render();
      };
    });
    main.querySelectorAll('[data-init][data-field]').forEach(el => {
      el.oninput = () => {
        const i = ws.initiatives.find(x => x.id === el.dataset.init);
        if (i) { i[el.dataset.field] = el.value; save(); }
      };
    });
    main.querySelectorAll('[data-init-del]').forEach(b => {
      b.onclick = () => { ws.initiatives = ws.initiatives.filter(i => i.id !== b.dataset.initDel); save(); render(); };
    });
  }

  if (s.type === 'vision-synthesis') {
    const ta = main.querySelector('#frVision');
    if (ta) ta.oninput = () => { ws.visionStatement = ta.value; save(); };
  }
}

// -------- Grounding panel --------
function renderGrounding() {
  const el = document.getElementById('frGrounding');
  const g = ws.grounding || { confirmed: [], validate: [], sources: [] };
  el.classList.toggle('collapsed', !groundingOpen);
  el.innerHTML = `
    <button class="fr-ground-toggle" id="frGroundToggle" title="Toggle grounding">${groundingOpen ? '›' : '‹'}</button>
    <div class="fr-ground-inner">
      <h3>Grounding</h3>
      ${ws.meta?.groundingNote ? `<p class="fr-ground-note">${esc(ws.meta.groundingNote)}</p>` : ''}
      <div class="fr-ground-sec">
        <h4>Confirmed</h4>
        <ul>${g.confirmed.map(x => `<li>${esc(x)}</li>`).join('') || '<li class="muted">None</li>'}</ul>
      </div>
      <div class="fr-ground-sec">
        <h4>To validate</h4>
        <ul>${g.validate.map(x => `<li>${esc(x)}</li>`).join('') || '<li class="muted">None</li>'}</ul>
      </div>
      <div class="fr-ground-sec">
        <h4>Sources</h4>
        <ul>${g.sources.map(x => `<li>${esc(x)}</li>`).join('') || '<li class="muted">None</li>'}</ul>
      </div>
      ${ws.meta?.facilitator || ws.meta?.generatedDate ? `<div class="fr-ground-foot">
        ${ws.meta.facilitator ? `<div><span class="lbl">Facilitator</span>${esc(ws.meta.facilitator)}</div>` : ''}
        ${ws.meta.generatedDate ? `<div><span class="lbl">Generated</span>${esc(ws.meta.generatedDate)}</div>` : ''}
      </div>` : ''}
    </div>
  `;
  el.querySelector('#frGroundToggle').onclick = () => { groundingOpen = !groundingOpen; renderGrounding(); };
}

// -------- CSS --------
function frontierCss() {
  return `
    body.frontier-open { overflow: hidden; }
    #frontierApp {
      position: fixed; inset: 0; z-index: 9000;
      background: linear-gradient(180deg, #f6f7fb 0%, #eef1f7 100%);
      display: flex; flex-direction: column;
      font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1d1d1f;
    }
    .fr-top {
      display: flex; align-items: center; gap: 16px;
      padding: 12px 20px; background: rgba(255,255,255,.85); backdrop-filter: blur(14px);
      border-bottom: 1px solid rgba(0,0,0,.06);
    }
    .fr-brand { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
    .fr-logo { width: 32px; height: 32px; border-radius: 8px;
      background: linear-gradient(135deg, #6366f1, #a855f7 50%, #ec4899); }
    .fr-brand-title { font-weight: 600; font-size: 15px; }
    .fr-brand-sub { font-size: 12px; color: #6b7280; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60ch; }
    .fr-actions { display: flex; gap: 8px; }
    .fr-btn {
      appearance: none; border: 1px solid rgba(0,0,0,.08); background: #fff;
      padding: 7px 14px; border-radius: 8px; font: 500 13px "Segoe UI", sans-serif; color: #1d1d1f;
      cursor: pointer; transition: all .15s;
    }
    .fr-btn:hover { background: #f4f4f7; border-color: rgba(0,0,0,.14); }
    .fr-btn.primary { background: #0a84ff; color: #fff; border-color: #0a84ff; }
    .fr-btn.primary:hover { background: #0969d9; }
    .fr-btn.ghost { background: transparent; }
    .fr-btn.small { padding: 4px 10px; font-size: 12px; }

    .fr-body { flex: 1; display: grid; grid-template-columns: 260px 1fr 300px; min-height: 0; }
    body.frontier-open #frontierApp .fr-grounding.collapsed { width: 30px; }
    .fr-body:has(.fr-grounding.collapsed) { grid-template-columns: 260px 1fr 30px; }

    .fr-rail { background: rgba(255,255,255,.55); border-right: 1px solid rgba(0,0,0,.06); overflow: auto; padding: 16px 10px; }
    .fr-rail-hd { text-transform: uppercase; letter-spacing: .08em; font-size: 11px; font-weight: 600; color: #6b7280; padding: 0 8px 10px; }
    .fr-steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
    .fr-step { display: flex; gap: 12px; padding: 10px 12px; border-radius: 10px; cursor: pointer; align-items: flex-start; }
    .fr-step:hover { background: rgba(0,0,0,.03); }
    .fr-step.active { background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04); }
    .fr-step-num { width: 24px; height: 24px; border-radius: 50%; background: #eef1f7; color: #4b5563; display:flex; align-items:center; justify-content:center; font-weight: 600; font-size: 12px; flex-shrink: 0; }
    .fr-step.active .fr-step-num { background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; }
    .fr-step-title { font-weight: 600; font-size: 13px; line-height: 1.3; }
    .fr-step-meta { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .fr-step-type { text-transform: none; }

    .fr-main { overflow: auto; padding: 24px 32px; }
    .fr-empty { color: #6b7280; padding: 24px; text-align: center; }
    .fr-empty.small { padding: 12px; font-size: 12px; }
    .fr-blank { max-width: 520px; margin: 80px auto; text-align: center; }
    .fr-blank h2 { font-weight: 600; font-size: 28px; margin: 0 0 12px; }
    .fr-blank p { color: #6b7280; line-height: 1.5; margin-bottom: 24px; }

    .fr-step-hd { margin-bottom: 24px; }
    .fr-step-hd-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
    .fr-step-chip { background: rgba(99,102,241,.1); color: #4f46e5; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
    .fr-nav { display: flex; gap: 8px; }
    .fr-step-hd h1 { font-weight: 600; font-size: 24px; margin: 0 0 12px; letter-spacing: -0.02em; }
    .fr-prompt { font-size: 16px; line-height: 1.5; color: #1d1d1f; margin: 0 0 10px; padding: 16px; background: #fff; border-radius: 12px; border: 1px solid rgba(0,0,0,.06); }
    .fr-guidance { font-size: 13px; color: #4b5563; margin: 0 0 6px; }
    .fr-capture { font-size: 12px; color: #6b7280; margin: 0; }

    .fr-notes-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; }
    .fr-notes-count { color: #6b7280; font-size: 13px; }
    .fr-notes-add { display: flex; gap: 8px; flex: 1; max-width: 560px; }
    .fr-notes-add input { flex: 1; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,.12); font: 400 13px "Segoe UI"; }
    .fr-notes { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
    .fr-note { background: #fff59d; border-radius: 8px; padding: 12px; box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 6px 12px rgba(0,0,0,.06); position: relative; }
    .fr-note-top { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; min-height: 20px; }
    .fr-note-text { font-size: 13px; line-height: 1.4; outline: none; min-height: 40px; }
    .fr-note-enabled { margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,.15); font-size: 12px; color: #4b5563; }
    .fr-note-enabled .lbl { display: block; text-transform: uppercase; font-size: 10px; letter-spacing: .05em; font-weight: 600; color: #6b7280; margin-bottom: 2px; }
    .fr-note-del { margin-left: auto; background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 16px; line-height: 1; padding: 0 4px; border-radius: 4px; }
    .fr-note-del:hover { color: #dc2626; background: rgba(0,0,0,.04); }
    .fr-tag { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; padding: 2px 6px; border-radius: 4px; }
    .fr-tag.pillar-work { background: #dbeafe; color: #1e40af; }
    .fr-tag.pillar-serve { background: #dcfce7; color: #166534; }
    .fr-tag.pillar-innovate { background: #fce7f3; color: #9d174d; }

    .fr-probes { background: #fff; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; border: 1px solid rgba(0,0,0,.06); }
    .fr-probes-hd { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; font-weight: 600; margin-bottom: 8px; }
    .fr-probe-list, .fr-bank { display: flex; flex-wrap: wrap; gap: 6px; }
    .fr-chip { background: #eef1f7; border: 1px solid rgba(0,0,0,.06); border-radius: 999px; padding: 6px 12px; font-size: 12px; cursor: pointer; text-align: left; font-family: inherit; color: #374151; }
    .fr-chip:hover { background: #dfe4ec; }
    .fr-chip.probe { background: #fef3c7; color: #92400e; }

    .fr-cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .fr-col { background: rgba(255,255,255,.7); border-radius: 12px; padding: 14px; border: 1px solid rgba(0,0,0,.06); display: flex; flex-direction: column; gap: 10px; }
    .fr-col-hd .fr-col-title { font-weight: 600; font-size: 14px; }
    .fr-col-hd .fr-col-sub { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }
    .fr-context { font-size: 12px; color: #4b5563; background: #f9fafb; padding: 8px 10px; border-radius: 6px; border-left: 3px solid #a855f7; }
    .fr-context .lbl { display: block; text-transform: uppercase; font-size: 10px; letter-spacing: .05em; font-weight: 600; color: #6b7280; margin-bottom: 2px; }
    .fr-col-add { display: grid; gap: 6px; }
    .fr-col-add input { padding: 7px 10px; border-radius: 6px; border: 1px solid rgba(0,0,0,.12); font: 400 12px "Segoe UI"; }
    .fr-col-notes { display: flex; flex-direction: column; gap: 8px; }

    .fr-cluster-layout { display: grid; grid-template-columns: 1.2fr 1fr; grid-template-areas: "clusters pool" "matrix matrix"; gap: 20px; }
    .fr-clusters { grid-area: clusters; }
    .fr-pool { grid-area: pool; background: rgba(255,255,255,.7); border-radius: 12px; padding: 14px; border: 1px solid rgba(0,0,0,.06); max-height: 500px; overflow: auto; }
    .fr-matrix { grid-area: matrix; background: #fff; border-radius: 12px; padding: 16px; border: 1px solid rgba(0,0,0,.06); }
    .fr-clusters-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .fr-clusters-hd h3, .fr-pool h3 { margin: 0; font-size: 14px; font-weight: 600; }
    .fr-count { color: #6b7280; font-weight: 400; font-size: 12px; margin-left: 6px; }
    .fr-cluster-add { display: flex; gap: 6px; }
    .fr-cluster-add input { padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(0,0,0,.12); font: 400 12px "Segoe UI"; }
    .fr-cluster { background: rgba(255,255,255,.85); border-radius: 10px; padding: 12px; margin-bottom: 10px; border: 1px solid rgba(0,0,0,.06); }
    .fr-cluster.drop-over { border-color: #6366f1; background: #eef2ff; }
    .fr-cluster-top { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .fr-cluster-name { flex: 1; padding: 4px 8px; border: 1px solid transparent; border-radius: 6px; font: 600 14px "Segoe UI"; background: transparent; }
    .fr-cluster-name:hover, .fr-cluster-name:focus { border-color: rgba(0,0,0,.12); background: #fff; outline: none; }
    .fr-cluster-scores { display: flex; gap: 16px; margin-bottom: 10px; font-size: 12px; color: #4b5563; }
    .fr-cluster-scores label { display: flex; align-items: center; gap: 6px; }
    .fr-cluster-scores input[type=range] { width: 90px; }
    .fr-cluster-notes { display: flex; flex-direction: column; gap: 6px; min-height: 40px; }
    .fr-pool-note { display: flex; align-items: center; gap: 8px; background: #f9fafb; border-radius: 6px; padding: 6px 10px; font-size: 12px; cursor: grab; border: 1px solid rgba(0,0,0,.06); }
    .fr-pool-note:active { cursor: grabbing; }
    .fr-pool-note.in-cluster { background: #fff59d; }
    .fr-pool-text { flex: 1; }
    .fr-pool-step { color: #9ca3af; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
    .fr-pool-list { display: flex; flex-direction: column; gap: 6px; }

    .fr-matrix-hd { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; font-weight: 600; margin-bottom: 12px; }
    .fr-matrix-wrap { display: grid; grid-template-columns: 60px 1fr; grid-template-rows: 1fr 24px; gap: 8px; height: 340px; }
    .fr-axis-y { display: flex; flex-direction: column; justify-content: space-between; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; padding: 4px 0; align-items: flex-end; }
    .fr-axis-x { grid-column: 2; display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; padding: 0 4px; }
    .fr-matrix-grid { position: relative; background:
      linear-gradient(to right, transparent 49.5%, rgba(0,0,0,.08) 49.5%, rgba(0,0,0,.08) 50.5%, transparent 50.5%),
      linear-gradient(to bottom, transparent 49.5%, rgba(0,0,0,.08) 49.5%, rgba(0,0,0,.08) 50.5%, transparent 50.5%),
      #fafbfd;
      border: 1px solid rgba(0,0,0,.1); border-radius: 8px; }
    .fr-token { position: absolute; transform: translate(-50%, -50%); background: #6366f1; color: #fff; padding: 5px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; cursor: grab; user-select: none; box-shadow: 0 2px 4px rgba(0,0,0,.15); max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fr-token:active { cursor: grabbing; }

    .fr-inits { display: flex; flex-direction: column; gap: 20px; }
    .fr-init-cluster { background: rgba(255,255,255,.7); border-radius: 12px; padding: 14px; border: 1px solid rgba(0,0,0,.06); }
    .fr-init-hd { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .fr-init-hd h3 { margin: 0; font-size: 15px; font-weight: 600; }
    .fr-init-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .fr-init-card { background: #fff; border-radius: 10px; padding: 12px; border: 1px solid rgba(0,0,0,.06); position: relative; display: flex; flex-direction: column; gap: 8px; }
    .fr-init-card .fr-note-del { position: absolute; top: 4px; right: 4px; }
    .fr-init-field { display: flex; flex-direction: column; gap: 3px; }
    .fr-init-field span { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; color: #6b7280; }
    .fr-init-field textarea, .fr-init-field select { padding: 6px 8px; border-radius: 6px; border: 1px solid rgba(0,0,0,.12); font: 400 12px "Segoe UI"; resize: vertical; }
    .fr-init-field.big span { font-size: 12px; }
    .fr-init-field.big textarea { font-size: 15px; padding: 12px; }

    .fr-vision { display: flex; flex-direction: column; gap: 24px; }
    .fr-recap { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .fr-recap-col { background: rgba(255,255,255,.7); border-radius: 10px; padding: 12px 14px; border: 1px solid rgba(0,0,0,.06); }
    .fr-recap-col h4 { margin: 0 0 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
    .fr-recap-col ul { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.5; }
    .fr-recap-col .muted { color: #9ca3af; }

    .fr-grounding { background: rgba(255,255,255,.65); border-left: 1px solid rgba(0,0,0,.06); overflow: auto; position: relative; transition: width .2s; }
    .fr-grounding.collapsed .fr-ground-inner { display: none; }
    .fr-ground-toggle { position: absolute; top: 12px; left: -14px; width: 28px; height: 28px; border-radius: 50%; background: #fff; border: 1px solid rgba(0,0,0,.08); cursor: pointer; font-size: 16px; color: #6b7280; z-index: 1; }
    .fr-ground-inner { padding: 16px 18px; }
    .fr-ground-inner h3 { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
    .fr-ground-note { font-size: 12px; color: #6b7280; font-style: italic; margin: 0 0 16px; line-height: 1.5; padding: 8px 10px; background: #fef3c7; border-radius: 6px; }
    .fr-ground-sec { margin-bottom: 16px; }
    .fr-ground-sec h4 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; color: #4b5563; }
    .fr-ground-sec ul { margin: 0; padding-left: 16px; font-size: 12px; line-height: 1.5; color: #1d1d1f; }
    .fr-ground-sec .muted { color: #9ca3af; }
    .fr-ground-foot { padding-top: 12px; border-top: 1px solid rgba(0,0,0,.06); font-size: 11px; color: #6b7280; }
    .fr-ground-foot div { margin-bottom: 4px; }
    .fr-ground-foot .lbl { display: inline-block; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; margin-right: 6px; color: #9ca3af; }
  `;
}
