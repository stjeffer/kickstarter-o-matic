// Export system: PNG, PDF, DOCX, JSON
import { state, save } from './state.js';
import { CANVAS_META } from './constants.js';
import { $ } from './utils.js';
import { renderCards, renderConnections, renderAll } from './render.js';

const SMART_EXPORT = {
  whiteboard:'png', mindmap:'png', matrix2x2:'png', journey:'pdf', empathy:'pdf',
  hswimlanes:'pdf', vswimlanes:'pdf', raci:'docx', strategy:'docx', backcast:'docx', usecase:'docx',
  cluster:'png', objectives:'docx', initiatives:'docx', plan:'docx',
};
const EXPORT_LABELS = { png:'PNG snapshot', pdf:'PDF structured report', docx:'Word (.docx) report', json:'JSON session data' };

export function updateSmartExportLabel(){
  const ct = state.canvasType || 'whiteboard';
  const kind = SMART_EXPORT[ct] || 'png';
  const btn = $('#exportSmartBtn'); const lbl = $('#exportSmartLabel');
  if(btn) btn.querySelector('span:last-child').textContent = 'Smart export — ' + EXPORT_LABELS[kind];
  if(lbl) lbl.textContent = 'Suggested for ' + (CANVAS_META[ct]?.label || ct);
}

function downloadBlob(blob, name){
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();}, 100);
}

function safeFilename(){
  const t = (state.session?.title || 'discovery-canvas').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'discovery-canvas';
  return t;
}

function collectStages(){
  if(state.session){ window.__persistCurrentStage && window.__persistCurrentStage(); return state.session.stages; }
  return [{
    name: 'Canvas', description: '', canvasType: state.canvasType,
    lanes: state.lanes, prompts: state.prompts, cards: state.cards, connections: state.connections,
  }];
}

function cardsByLane(stage){
  const groups = new Map();
  const laneOf = c => {
    if(c.lane){ const l = stage.lanes.find(x=>x.id===c.lane); if(l) return l.name; }
    return 'Unassigned';
  };
  (stage.cards||[]).forEach(c=>{
    if(c.type==='prompt' || c.type==='painscore' || c.type==='title') return;
    const k = laneOf(c);
    if(!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  });
  const ordered = [];
  (stage.lanes||[]).forEach(l=>{ if(groups.has(l.name)) ordered.push([l.name, groups.get(l.name)]); });
  if(groups.has('Unassigned')) ordered.push(['Unassigned', groups.get('Unassigned')]);
  return ordered;
}

function isFrontierSession(){
  const stages = collectStages();
  if(stages.some(s=>s.stageKind)) return true;
  const t = (state.session?.sessionType || '').toLowerCase();
  return /frontier|action plan|backcast/.test(t);
}
function stageOfKind(stages, kind){ return stages.find(s=>s.stageKind===kind); }
function cardTextOf(c){ return (c.text || '').trim(); }
function nonMetaCards(stage){
  return (stage.cards||[]).filter(c=> !['prompt','painscore','title'].includes(c.type));
}
function painPointsAcross(stages){
  const rows = [];
  stages.forEach(stage=>{
    (stage.cards||[]).forEach(c=>{
      if(!c.painPoint) return;
      const sc = c.painScoreId ? (stage.cards.find(x=>x.id===c.painScoreId)) : null;
      const s = sc?.scores || {};
      rows.push({
        stage: stage.name,
        text: cardTextOf(c) || '(untitled)',
        frequency: s.frequency||0, impact: s.impact||0, population: s.population||0,
        total: (s.frequency||0)+(s.impact||0)+(s.population||0),
      });
    });
  });
  rows.sort((a,b)=>b.total-a.total);
  return rows;
}
function initiativesByObjective(stage, allStages){
  const objectives = (allStages.flatMap(s=>s.cards||[])).filter(c=>c.type==='objective');
  const inis = (stage.cards||[]).filter(c=>c.type==='initiative');
  const conns = allStages.flatMap(s=>s.connections||[]);
  const byObj = new Map(objectives.map(o=>[o.id, []]));
  const orphan = [];
  inis.forEach(ini=>{
    const link = conns.find(k=> (k.from===ini.id || k.to===ini.id) && objectives.some(o=>o.id===k.from||o.id===k.to));
    const objId = link ? [link.from, link.to].find(id=>objectives.some(o=>o.id===id)) : null;
    if(objId && byObj.has(objId)) byObj.get(objId).push(ini);
    else orphan.push(ini);
  });
  return { objectives, byObj, orphan };
}

// ============ PNG export ============
async function exportPNG(){
  const viewport = document.getElementById('viewport');
  const canvas = await window.html2canvas(viewport, { backgroundColor: null, scale: 2 });
  canvas.toBlob(blob => { downloadBlob(blob, safeFilename()+'.png'); }, 'image/png');
}

// ============ PDF export ============
async function exportPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'pt', format:'a4' });
  const M = 48; const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
  let y = M;
  const newPage = ()=>{ doc.addPage(); y = M; };
  const need = h => { if(y + h > H - M) newPage(); };
  const text = (s, opts={})=>{
    const size = opts.size||11, style = opts.style||'normal', color = opts.color||[30,30,32];
    const indent = opts.indent||0;
    doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(s||''), W - M*2 - indent);
    lines.forEach(ln=>{ need(size*1.4); doc.text(ln, M+indent, y); y += size * 1.35; });
  };
  const gap = (h=6)=>{ need(h); y += h; };
  const rule = ()=>{ need(12); doc.setDrawColor(220); doc.line(M, y, W-M, y); y += 10; };
  const banner = (label, color=[10,80,170])=>{
    need(28);
    doc.setFillColor(color[0], color[1], color[2]); doc.rect(M, y-2, W-M*2, 22, 'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(12);
    doc.text(label, M+8, y+13); y += 30;
  };

  const s = state.session || {};
  const stages = collectStages();
  const frontier = isFrontierSession();

  // Cover
  text(s.title || 'Discovery Canvas', { size:24, style:'bold' });
  const meta = [s.customer, s.sessionType, s.date].filter(Boolean).join('  •  ');
  if(meta) text(meta, { size:11, color:[110,110,120] });
  if(s.description){ gap(6); text(s.description, { size:11 }); }
  gap(10); rule();

  if(frontier){
    banner('Executive Summary', [10,80,170]);
    const future = stageOfKind(stages,'future');
    const objectives = stageOfKind(stages,'objectives');
    const initiatives = stageOfKind(stages,'initiatives');
    const plan = stageOfKind(stages,'plan');

    const futureOutcome = future ? nonMetaCards(future).filter(c=> (future.lanes||[]).find(l=>l.id===c.lane)?.name?.toLowerCase().includes('future outcome')) : [];
    if(futureOutcome.length){
      text('Future outcome we are working toward:', { size:11, style:'bold' });
      futureOutcome.forEach(c=> text('• ' + cardTextOf(c), { size:11, indent:12 }));
      gap(4);
    }
    const promoted = (objectives?.cards||[]).filter(c=>c.type==='objective' && c.promoted);
    const allObj = (objectives?.cards||[]).filter(c=>c.type==='objective');
    text(`Objectives defined: ${allObj.length}   •   Promoted to plan: ${promoted.length}`, { size:11 });
    const iniCount = (initiatives?.cards||[]).filter(c=>c.type==='initiative').length;
    text(`Initiatives scoped: ${iniCount}`, { size:11 });
    const horizonCounts = {now:0, next:0, later:0};
    (plan?.cards||initiatives?.cards||[]).filter(c=>c.type==='initiative').forEach(c=>{ horizonCounts[c.horizon||'now'] = (horizonCounts[c.horizon||'now']||0)+1; });
    text(`Plan distribution — Now: ${horizonCounts.now}  •  Next: ${horizonCounts.next}  •  Later: ${horizonCounts.later}`, { size:11 });
    gap(10); rule();
  }

  stages.forEach((stage, i)=>{
    banner(`Stage ${i+1}: ${stage.name}`, [10,80,170]);
    text(`Layout: ${CANVAS_META[stage.canvasType]?.label || stage.canvasType}${stage.stageKind?'   •   Kind: '+stage.stageKind:''}`, { size:9, color:[120,120,130] });
    if(stage.description){ gap(3); text(stage.description, { size:10.5 }); }

    if(stage.prompts?.length){
      gap(6); text('Prompts & guidance', { size:12, style:'bold', color:[60,60,70] });
      stage.prompts.forEach(p=>{
        text('• ' + (p.text || ''), { size:10.5 });
        if(p.category) text(p.category, { size:9, color:[130,130,140], indent:14 });
        if(p.activity?.facilitatorNotes) text('Collaborative guidance: ' + p.activity.facilitatorNotes, { size:9, color:[130,130,140], indent:14 });
      });
    }

    gap(8);
    renderStageDetailPDF(stage, stages, { text, gap, rule, banner, need });
    if(i < stages.length - 1){ gap(10); rule(); }
  });

  const pains = painPointsAcross(stages);
  if(pains.length){
    newPage();
    banner('Pain Points — Scored', [200,60,60]);
    text('Ranked by total severity (Frequency + Impact + Population, each 1–3).', { size:10, color:[110,110,120] });
    gap(6);
    pains.forEach(p=>{
      text(`${p.total}/9  —  ${p.text}`, { size:11, style:'bold' });
      text(`Stage: ${p.stage}   •   Frequency ${p.frequency}   Impact ${p.impact}   Population ${p.population}`, { size:9.5, color:[110,110,120], indent:12 });
      gap(3);
    });
  }

  doc.save(safeFilename()+'.pdf');
}

function renderStageDetailPDF(stage, allStages, io){
  const { text, gap, need } = io;
  const kind = stage.stageKind;
  const cards = nonMetaCards(stage);

  if(kind === 'future'){
    const LANE_ORDER = ['future outcome','what had to be true','signals','evidence','enablers','guardrails','today'];
    const laneList = (stage.lanes||[]).slice().sort((a,b)=>{
      const ai = LANE_ORDER.findIndex(x=>a.name.toLowerCase().includes(x));
      const bi = LANE_ORDER.findIndex(x=>b.name.toLowerCase().includes(x));
      return (ai<0?99:ai)-(bi<0?99:bi);
    });
    laneList.forEach(l=>{
      const items = cards.filter(c=>c.lane===l.id);
      if(!items.length) return;
      text(l.name, { size:12, style:'bold', color:[70,70,90] });
      items.forEach(c=> text('• ' + (cardTextOf(c)||'(empty)'), { size:11, indent:12 }));
      gap(4);
    });
    const un = cards.filter(c=>!c.lane);
    if(un.length){ text('Unplaced', { size:11, style:'bold', color:[120,120,130] }); un.forEach(c=> text('• ' + cardTextOf(c), { size:11, indent:12 })); }
    return;
  }
  if(kind === 'cluster'){
    const groups = cards.filter(c=>c.type==='group');
    groups.forEach(g=>{
      text(cardTextOf(g) || 'Untitled cluster', { size:13, style:'bold', color:[10,80,170] });
      const members = cards.filter(c=>c.groupId===g.id && c.type!=='group');
      if(!members.length) text('(no members yet)', { size:10, color:[150,150,160], indent:12 });
      members.forEach(m=> text('• ' + (cardTextOf(m)||'(empty)'), { size:11, indent:12 }));
      gap(4);
    });
    const orphans = cards.filter(c=>c.type!=='group' && !c.groupId);
    if(orphans.length){
      text('Unclustered ideas', { size:12, style:'bold', color:[120,120,130] });
      orphans.forEach(m=> text('• ' + cardTextOf(m), { size:11, indent:12 }));
    }
    return;
  }
  if(kind === 'objectives'){
    const objs = cards.filter(c=>c.type==='objective');
    if(!objs.length){ text('(No objectives defined.)', { size:10, color:[150,150,160] }); return; }
    objs.forEach((o,idx)=>{
      text(`${idx+1}. ${cardTextOf(o) || 'Untitled objective'}${o.promoted?'   ★ promoted':''}`, { size:12, style:'bold', color:[88,86,214] });
      if(o.why)     text('Why it matters: ' + o.why, { size:10.5, indent:12 });
      if(o.measure) text('Measure of success: ' + o.measure, { size:10.5, indent:12 });
      gap(4);
    });
    return;
  }
  if(kind === 'initiatives'){
    const { objectives, byObj, orphan } = initiativesByObjective(stage, allStages);
    objectives.forEach(o=>{
      const list = byObj.get(o.id) || [];
      if(!list.length) return;
      text('Objective: ' + (cardTextOf(o)||'Untitled'), { size:12, style:'bold', color:[88,86,214] });
      list.forEach(ini=> renderInitiativePDF(ini, io, 12));
      gap(4);
    });
    if(orphan.length){
      text('Unlinked initiatives', { size:12, style:'bold', color:[120,120,130] });
      orphan.forEach(ini=> renderInitiativePDF(ini, io, 12));
    }
    return;
  }
  if(kind === 'plan'){
    const horizons = [['now','Now (0–3 months)'],['next','Next (3–6 months)'],['later','Later (6–12 months)']];
    const inis = cards.filter(c=>c.type==='initiative');
    horizons.forEach(([k,label])=>{
      const items = inis.filter(c=>(c.horizon||'now')===k);
      text(label, { size:12, style:'bold', color:[10,80,170] });
      if(!items.length) text('(nothing scheduled)', { size:10, color:[150,150,160], indent:12 });
      items.forEach(ini=> renderInitiativePDF(ini, io, 12));
      gap(4);
    });
    return;
  }

  // Generic fallback
  const grouped = cardsByLane(stage);
  if(grouped.length){
    text('Contributions', { size:12, style:'bold' });
    grouped.forEach(([laneName, list])=>{
      gap(2); text(laneName, { size:11, style:'bold', color:[70,70,80] });
      list.forEach(c=>{
        const label = (c.type && !['sticky','note'].includes(c.type)) ? ` [${c.type}]` : '';
        text('  – ' + (cardTextOf(c)||'(empty)') + label, { size:10.5 });
      });
    });
  } else {
    text('(No cards added yet.)', { size:10, color:[150,150,160] });
  }
}

function renderInitiativePDF(ini, io, indent){
  const { text } = io;
  text('▸ ' + (cardTextOf(ini) || 'Untitled initiative'), { size:11.5, style:'bold', indent });
  if(ini.hypothesis) text('Hypothesis: ' + ini.hypothesis, { size:10, color:[80,80,90], indent:indent+12 });
  const tags = [
    ini.owner && `Owner: ${ini.owner}`,
    ini.effort && `Effort: ${ini.effort}`,
    (ini.impact!=null) && `Impact: ${ini.impact}/5`,
    ini.horizon && `Horizon: ${ini.horizon}`,
  ].filter(Boolean).join('   •   ');
  if(tags) text(tags, { size:9.5, color:[110,110,120], indent:indent+12 });
}

// ============ DOCX export ============
async function exportDOCX(){
  const D = window.docx;
  if(!D){ alert('Word export library failed to load.'); return; }
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType } = D;

  const border = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
  const cellBorders = { top:border, bottom:border, left:border, right:border };
  const P = (t, opts={}) => new Paragraph({ children:[new TextRun({ text: t||'', bold: !!opts.bold, italics: !!opts.italics, color: opts.color, size: opts.size })], spacing: opts.spacing });
  const H = (t, lvl) => new Paragraph({ text: t, heading: lvl });
  const bullet = (t, opts={}) => new Paragraph({ children:[new TextRun({ text: t, italics: !!opts.italics, color: opts.color, size: opts.size })], bullet:{ level: opts.level||0 } });
  const empty = () => new Paragraph({ text:'' });
  const cell = (children, opts={}) => new TableCell({
    borders: cellBorders,
    width: opts.width,
    shading: opts.fill ? { type: ShadingType.CLEAR, color:'auto', fill: opts.fill } : undefined,
    children: Array.isArray(children) ? children : [typeof children==='string' ? P(children) : children],
  });
  const headerRow = (cols) => new TableRow({ tableHeader:true, children: cols.map(c=> cell([P(c.text,{bold:true})], { width:c.width, fill:'EEF3FF' })) });

  const s = state.session || {};
  const stages = collectStages();
  const frontier = isFrontierSession();
  const children = [];

  children.push(new Paragraph({ text: s.title || 'Discovery Canvas', heading: HeadingLevel.TITLE }));
  const metaBits = [s.customer && `Customer: ${s.customer}`, s.sessionType && `Session type: ${s.sessionType}`, s.date && `Date: ${s.date}`].filter(Boolean);
  if(metaBits.length) children.push(P(metaBits.join('   •   '), { italics:true, color:'666666' }));
  if(s.description){ children.push(empty()); children.push(P(s.description)); }
  children.push(empty());

  if(frontier){
    children.push(H('Executive Summary', HeadingLevel.HEADING_1));
    const future = stageOfKind(stages,'future');
    const cluster = stageOfKind(stages,'cluster');
    const objectivesStage = stageOfKind(stages,'objectives');
    const initiativesStage = stageOfKind(stages,'initiatives');
    const planStage = stageOfKind(stages,'plan');

    const outcomes = future ? nonMetaCards(future).filter(c=> (future.lanes||[]).find(l=>l.id===c.lane)?.name?.toLowerCase().includes('future outcome')) : [];
    if(outcomes.length){
      children.push(P('Future outcome we are working toward', { bold:true }));
      outcomes.forEach(c=> children.push(bullet(cardTextOf(c)||'(untitled)')));
    }
    const preconditions = future ? nonMetaCards(future).filter(c=> (future.lanes||[]).find(l=>l.id===c.lane)?.name?.toLowerCase().includes('had to be true')) : [];
    if(preconditions.length){
      children.push(P('What had to be true', { bold:true }));
      preconditions.forEach(c=> children.push(bullet(cardTextOf(c)||'(untitled)')));
    }
    const clusters = cluster ? (cluster.cards||[]).filter(c=>c.type==='group') : [];
    if(clusters.length){
      children.push(P(`Themes clustered (${clusters.length})`, { bold:true }));
      clusters.forEach(g=>{
        const members = (cluster.cards||[]).filter(x=>x.groupId===g.id && x.type!=='group').length;
        children.push(bullet(`${cardTextOf(g)||'Untitled cluster'} — ${members} ${members===1?'idea':'ideas'}`));
      });
    }
    const allObj = (objectivesStage?.cards||[]).filter(c=>c.type==='objective');
    const promoted = allObj.filter(c=>c.promoted);
    children.push(P(`Objectives defined: ${allObj.length}   •   Promoted to plan: ${promoted.length}`));
    const iniAll = ((initiativesStage?.cards||[]).concat(planStage?.cards||[])).filter(c=>c.type==='initiative');
    const iniUnique = Array.from(new Map(iniAll.map(i=>[i.id,i])).values());
    const hz = { now:0, next:0, later:0 };
    iniUnique.forEach(c=> hz[c.horizon||'now'] = (hz[c.horizon||'now']||0)+1);
    children.push(P(`Initiatives: ${iniUnique.length}   •   Now: ${hz.now}   •   Next: ${hz.next}   •   Later: ${hz.later}`));
    children.push(empty());
  }

  stages.forEach((stage, i)=>{
    children.push(H(`Stage ${i+1}: ${stage.name}`, HeadingLevel.HEADING_1));
    children.push(P(`Layout: ${CANVAS_META[stage.canvasType]?.label || stage.canvasType}${stage.stageKind?'   •   Stage kind: '+stage.stageKind:''}`, { italics:true, color:'888888' }));
    if(stage.description){ children.push(P(stage.description)); }

    if(stage.prompts?.length){
      children.push(H('Prompts & guidance', HeadingLevel.HEADING_2));
      stage.prompts.forEach(p=>{
        children.push(bullet(p.text||''));
        if(p.category) children.push(new Paragraph({ children:[new TextRun({ text: p.category, italics:true, color:'888888', size:18 })] }));
        if(p.activity?.facilitatorNotes) children.push(new Paragraph({ children:[new TextRun({ text:'Collaborative guidance: '+p.activity.facilitatorNotes, italics:true, color:'888888', size:18 })] }));
      });
    }

    appendStageDetailDOCX(stage, stages, children, D);
    children.push(empty());
  });

  const pains = painPointsAcross(stages);
  if(pains.length){
    children.push(H('Pain Points — Scored', HeadingLevel.HEADING_1));
    children.push(P('Ranked by total severity (Frequency + Impact + Population, each 1–3).', { italics:true, color:'666666' }));
    const rows = [ headerRow([
      { text:'Rank', width:{size:8,type:WidthType.PERCENTAGE} },
      { text:'Pain point', width:{size:42,type:WidthType.PERCENTAGE} },
      { text:'Stage', width:{size:20,type:WidthType.PERCENTAGE} },
      { text:'Freq', width:{size:8,type:WidthType.PERCENTAGE} },
      { text:'Impact', width:{size:8,type:WidthType.PERCENTAGE} },
      { text:'Pop.', width:{size:6,type:WidthType.PERCENTAGE} },
      { text:'Total', width:{size:8,type:WidthType.PERCENTAGE} },
    ])];
    pains.forEach((p,idx)=>{
      rows.push(new TableRow({ children:[
        cell(String(idx+1)), cell(p.text), cell(p.stage),
        cell(String(p.frequency)), cell(String(p.impact)), cell(String(p.population)),
        cell([P(String(p.total),{bold:true})]),
      ]}));
    });
    children.push(new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows }));
  }

  const doc = new Document({ sections:[{ children }] });
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, safeFilename()+'.docx');
}

function appendStageDetailDOCX(stage, allStages, children, D){
  const { Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } = D;
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
  const cellBorders = { top:border, bottom:border, left:border, right:border };
  const P = (t, opts={}) => new Paragraph({ children:[new TextRun({ text: t||'', bold: !!opts.bold, italics: !!opts.italics, color: opts.color })] });
  const H = (t, lvl) => new Paragraph({ text:t, heading:lvl });
  const bullet = (t, opts={}) => new Paragraph({ children:[new TextRun({ text: t, italics: !!opts.italics, color: opts.color })], bullet:{ level: opts.level||0 } });
  const cell = (c, opts={}) => new TableCell({ borders:cellBorders, width:opts.width, shading: opts.fill?{type:ShadingType.CLEAR,color:'auto',fill:opts.fill}:undefined, children: Array.isArray(c)?c:[typeof c==='string'?P(c):c] });
  const headerRow = (cols)=> new TableRow({ tableHeader:true, children: cols.map(c=> cell([P(c.text,{bold:true})], { width:c.width, fill:'EEF3FF' })) });

  const kind = stage.stageKind;
  const cards = nonMetaCards(stage);

  if(kind === 'future'){
    children.push(H('Backcast', HeadingLevel.HEADING_2));
    const LANE_ORDER = ['future outcome','had to be true','signals','evidence','enablers','guardrails','today'];
    const laneList = (stage.lanes||[]).slice().sort((a,b)=>{
      const ai = LANE_ORDER.findIndex(x=>a.name.toLowerCase().includes(x));
      const bi = LANE_ORDER.findIndex(x=>b.name.toLowerCase().includes(x));
      return (ai<0?99:ai)-(bi<0?99:bi);
    });
    laneList.forEach(l=>{
      const items = cards.filter(c=>c.lane===l.id);
      if(!items.length) return;
      children.push(H(l.name, HeadingLevel.HEADING_3));
      items.forEach(c=> children.push(bullet(cardTextOf(c)||'(empty)')));
    });
    const un = cards.filter(c=>!c.lane);
    if(un.length){
      children.push(H('Unplaced', HeadingLevel.HEADING_3));
      un.forEach(c=> children.push(bullet(cardTextOf(c))));
    }
    return;
  }
  if(kind === 'cluster'){
    children.push(H('Themes & clusters', HeadingLevel.HEADING_2));
    const groups = cards.filter(c=>c.type==='group');
    if(!groups.length){ children.push(P('(No clusters formed yet.)', { italics:true, color:'999999' })); }
    groups.forEach(g=>{
      children.push(H(cardTextOf(g)||'Untitled cluster', HeadingLevel.HEADING_3));
      const members = cards.filter(c=>c.groupId===g.id && c.type!=='group');
      if(!members.length) children.push(P('(no members yet)', { italics:true, color:'999999' }));
      members.forEach(m=> children.push(bullet(cardTextOf(m)||'(empty)')));
    });
    const orphans = cards.filter(c=>c.type!=='group' && !c.groupId);
    if(orphans.length){
      children.push(H('Unclustered ideas', HeadingLevel.HEADING_3));
      orphans.forEach(m=> children.push(bullet(cardTextOf(m))));
    }
    return;
  }
  if(kind === 'objectives'){
    children.push(H('Objectives', HeadingLevel.HEADING_2));
    const objs = cards.filter(c=>c.type==='objective');
    if(!objs.length){ children.push(P('(No objectives defined.)', { italics:true, color:'999999' })); return; }
    const rows = [ headerRow([
      { text:'#', width:{size:6,type:WidthType.PERCENTAGE} },
      { text:'Objective', width:{size:30,type:WidthType.PERCENTAGE} },
      { text:'Why it matters', width:{size:30,type:WidthType.PERCENTAGE} },
      { text:'Measure of success', width:{size:26,type:WidthType.PERCENTAGE} },
      { text:'Promoted', width:{size:8,type:WidthType.PERCENTAGE} },
    ])];
    objs.forEach((o,idx)=>{
      rows.push(new TableRow({ children:[
        cell(String(idx+1)),
        cell([P(cardTextOf(o)||'Untitled', { bold:true })]),
        cell(o.why||''), cell(o.measure||''),
        cell(o.promoted?'★ Yes':'—'),
      ]}));
    });
    children.push(new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows }));
    return;
  }
  if(kind === 'initiatives'){
    children.push(H('Initiatives', HeadingLevel.HEADING_2));
    const { objectives, byObj, orphan } = initiativesByObjective(stage, allStages);
    const emit = (title, list) => {
      if(!list.length) return;
      children.push(H(title, HeadingLevel.HEADING_3));
      const rows = [ headerRow([
        { text:'Initiative', width:{size:26,type:WidthType.PERCENTAGE} },
        { text:'Hypothesis', width:{size:34,type:WidthType.PERCENTAGE} },
        { text:'Owner', width:{size:14,type:WidthType.PERCENTAGE} },
        { text:'Effort', width:{size:8,type:WidthType.PERCENTAGE} },
        { text:'Impact', width:{size:8,type:WidthType.PERCENTAGE} },
        { text:'Horizon', width:{size:10,type:WidthType.PERCENTAGE} },
      ])];
      list.forEach(ini=>{
        rows.push(new TableRow({ children:[
          cell([P(cardTextOf(ini)||'Untitled', { bold:true })]),
          cell(ini.hypothesis||''),
          cell(ini.owner||''),
          cell(ini.effort||''),
          cell(ini.impact!=null?`${ini.impact}/5`:''),
          cell(ini.horizon||'now'),
        ]}));
      });
      children.push(new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows }));
    };
    objectives.forEach(o=>{
      const list = byObj.get(o.id) || [];
      if(!list.length) return;
      emit('Objective: ' + (cardTextOf(o)||'Untitled'), list);
    });
    if(orphan.length) emit('Unlinked initiatives', orphan);
    if(!objectives.length && !orphan.length) children.push(P('(No initiatives scoped.)', { italics:true, color:'999999' }));
    return;
  }
  if(kind === 'plan'){
    children.push(H('Action plan', HeadingLevel.HEADING_2));
    const horizons = [['now','Now (0–3 months)','2fbf6f'],['next','Next (3–6 months)','ff9500'],['later','Later (6–12 months)','0a84ff']];
    const inis = cards.filter(c=>c.type==='initiative');
    horizons.forEach(([k,label,color])=>{
      const items = inis.filter(c=>(c.horizon||'now')===k);
      children.push(H(label, HeadingLevel.HEADING_3));
      if(!items.length){ children.push(P('(nothing scheduled)', { italics:true, color:'999999' })); return; }
      const rows = [ headerRow([
        { text:'Initiative', width:{size:32,type:WidthType.PERCENTAGE} },
        { text:'Hypothesis', width:{size:36,type:WidthType.PERCENTAGE} },
        { text:'Owner', width:{size:16,type:WidthType.PERCENTAGE} },
        { text:'Effort', width:{size:8,type:WidthType.PERCENTAGE} },
        { text:'Impact', width:{size:8,type:WidthType.PERCENTAGE} },
      ])];
      items.forEach(ini=>{
        rows.push(new TableRow({ children:[
          cell([P(cardTextOf(ini)||'Untitled', { bold:true })]),
          cell(ini.hypothesis||''),
          cell(ini.owner||''),
          cell(ini.effort||''),
          cell(ini.impact!=null?`${ini.impact}/5`:''),
        ]}));
      });
      children.push(new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows }));
    });
    return;
  }

  // Generic fallback
  const grouped = cardsByLane(stage);
  if(!grouped.length){ children.push(P('(No cards added yet.)', { italics:true, color:'999999' })); return; }
  children.push(H('Contributions', HeadingLevel.HEADING_2));
  const rows = [ headerRow([
    { text:'Grouping', width:{size:30,type:WidthType.PERCENTAGE} },
    { text:'Type', width:{size:15,type:WidthType.PERCENTAGE} },
    { text:'Content', width:{size:55,type:WidthType.PERCENTAGE} },
  ])];
  grouped.forEach(([laneName, list])=>{
    list.forEach((c, idx)=>{
      rows.push(new TableRow({ children:[
        cell(idx===0?laneName:''),
        cell(c.type||'sticky'),
        cell(cardTextOf(c)||''),
      ]}));
    });
  });
  children.push(new Table({ width:{size:100,type:WidthType.PERCENTAGE}, rows }));
}

// ============ JSON export ============
function exportJSON(){
  window.__persistCurrentStage && window.__persistCurrentStage();
  const {canvasType,lanes,prompts,cards,connections,session} = state;
  const payload = session ? { ...session, canvasType, lanes, prompts, cards, connections } : { canvasType, lanes, prompts, cards, connections };
  downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}), safeFilename()+'.json');
}

// ============ Run export ============
export async function runExport(kind){
  if(kind==='smart') kind = SMART_EXPORT[state.canvasType] || 'png';
  try{
    if(kind==='png') await exportPNG();
    else if(kind==='pdf') await exportPDF();
    else if(kind==='docx') await exportDOCX();
    else if(kind==='json') exportJSON();
  }catch(err){ console.error(err); alert('Export failed: '+err.message); }
}

// ============ Import ============
export function initExportUI(){
  const exportMenu = $('#exportMenu');
  $('#btnExport').addEventListener('click', e=>{
    e.stopPropagation();
    updateSmartExportLabel();
    exportMenu.classList.toggle('show');
  });
  document.addEventListener('click', e=>{
    if(!exportMenu.contains(e.target) && e.target.id!=='btnExport') exportMenu.classList.remove('show');
  });
  exportMenu.querySelectorAll('button[data-export]').forEach(b=>{
    b.addEventListener('click', ()=>{ exportMenu.classList.remove('show'); runExport(b.dataset.export); });
  });
  $('#canvasType').addEventListener('change', updateSmartExportLabel);

  $('#btnImport').addEventListener('click', ()=>{$('#importText').value=''; $('#importModal').classList.add('open')});
  $('#importCancel').addEventListener('click', ()=>$('#importModal').classList.remove('open'));
  $('#importConfirm').addEventListener('click', ()=>{
    try{
      const data = JSON.parse($('#importText').value);
      if(Array.isArray(data.stages)){
        window.__loadSessionFromSchema && window.__loadSessionFromSchema(data);
      }else{
        state.session = null;
        if(data.canvasType) state.canvasType = data.canvasType;
        if(Array.isArray(data.lanes)) state.lanes = data.lanes;
        if(Array.isArray(data.prompts)) state.prompts = data.prompts;
        if(Array.isArray(data.cards)) state.cards = data.cards;
        if(Array.isArray(data.connections)) state.connections = data.connections;
      }
      $('#canvasType').value = state.canvasType;
      renderAll(); save();
      $('#importModal').classList.remove('open');
    }catch(e){ alert('Invalid JSON: '+e.message) }
  });
}
