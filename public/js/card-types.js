// Card type definitions and SVG icon functions
import { svgTag } from './utils.js';

function stickyIcon(){return svgTag('<rect x="6" y="4" width="24" height="22" fill="#fff9b1" stroke="#e5c400" transform="rotate(-2 18 15)"/>')}
function noteIcon(){return svgTag('<rect x="4" y="4" width="28" height="22" rx="3" fill="#fff" stroke="#0a84ff" stroke-width="1.5"/><line x1="4" y1="4" x2="4" y2="26" stroke="#0a84ff" stroke-width="3"/>')}
function rectIcon(){return svgTag('<rect x="4" y="7" width="28" height="16" rx="3" fill="#fff" stroke="#1d1d1f" stroke-width="1.5"/>')}
function diamondIcon(){return svgTag('<polygon points="18,3 33,15 18,27 3,15" fill="#fff" stroke="#1d1d1f" stroke-width="1.5"/>')}
function pillIcon(){return svgTag('<rect x="4" y="8" width="28" height="14" rx="7" fill="#eaf4ff" stroke="#0a84ff" stroke-width="1.5"/>')}
function paraIcon(){return svgTag('<polygon points="8,7 33,7 28,23 3,23" fill="#f0fff4" stroke="#34c759" stroke-width="1.5"/>')}
function circleIcon(){return svgTag('<circle cx="18" cy="15" r="11" fill="#fff5e6" stroke="#ff9500" stroke-width="1.5"/>')}
function emotionIcon(){return svgTag('<circle cx="18" cy="15" r="11" fill="#fff" stroke="#1d1d1f" stroke-width="1.2"/><circle cx="14" cy="13" r="1.3" fill="#1d1d1f"/><circle cx="22" cy="13" r="1.3" fill="#1d1d1f"/><path d="M13 18 Q18 22 23 18" stroke="#1d1d1f" stroke-width="1.3" fill="none" stroke-linecap="round"/>')}
function quoteIcon(){return svgTag('<rect x="3" y="5" width="30" height="20" rx="4" fill="#fff" stroke="#0a84ff" stroke-width="1.3"/><text x="8" y="21" font-family="Georgia,serif" font-size="18" font-style="italic" fill="#0a84ff">"</text><line x1="16" y1="13" x2="28" y2="13" stroke="#c9dcf2" stroke-width="1.3"/><line x1="16" y1="17" x2="26" y2="17" stroke="#c9dcf2" stroke-width="1.3"/>')}
function painIcon(){return svgTag('<rect x="3" y="8" width="30" height="14" rx="7" fill="#fff5f4" stroke="#ff3b30" stroke-width="1.3"/><circle cx="9" cy="15" r="2" fill="#ff3b30"/><line x1="14" y1="14" x2="28" y2="14" stroke="#ffb4ac" stroke-width="1.3"/><line x1="14" y1="17" x2="24" y2="17" stroke="#ffb4ac" stroke-width="1.3"/>')}
function gainIcon(){return svgTag('<rect x="3" y="8" width="30" height="14" rx="7" fill="#f0fbf4" stroke="#34c759" stroke-width="1.3"/><polygon points="9,11 10.2,14 13.4,14 10.8,16 11.8,19 9,17.2 6.2,19 7.2,16 4.6,14 7.8,14" fill="#34c759"/><line x1="15" y1="14" x2="28" y2="14" stroke="#a4e0b8" stroke-width="1.3"/><line x1="15" y1="17" x2="25" y2="17" stroke="#a4e0b8" stroke-width="1.3"/>')}
function momentIcon(){return svgTag('<rect x="4" y="7" width="28" height="16" rx="3" fill="#fff" stroke="#c7c7cc" stroke-width="1.2"/><rect x="4" y="7" width="28" height="3" fill="#0a84ff"/>')}
function personaIcon(){return svgTag('<rect x="3" y="5" width="30" height="20" rx="4" fill="#fff" stroke="#1d1d1f" stroke-width="1.2"/><circle cx="10" cy="14" r="4" fill="url(#pg)" /><defs><linearGradient id="pg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#0a84ff"/><stop offset="1" stop-color="#5ac8fa"/></linearGradient></defs><line x1="17" y1="12" x2="29" y2="12" stroke="#c7c7cc" stroke-width="1.3"/><line x1="17" y1="16" x2="27" y2="16" stroke="#c7c7cc" stroke-width="1.3"/><line x1="17" y1="20" x2="25" y2="20" stroke="#c7c7cc" stroke-width="1.3"/>')}
function promptIcon(){return svgTag('<rect x="4" y="5" width="28" height="20" rx="5" fill="#fff" stroke="#0a84ff" stroke-width="1.3"/><line x1="9" y1="12" x2="27" y2="12" stroke="#0a84ff" stroke-width="1.5" stroke-linecap="round"/><line x1="9" y1="17" x2="21" y2="17" stroke="#a4b8d4" stroke-width="1.5" stroke-linecap="round"/>')}
function delayIcon(){return svgTag('<path d="M4 7 H22 A8 8 0 0 1 22 23 H4 Z" fill="#fffaf0" stroke="#ff9500" stroke-width="1.5"/>')}
function handoffIcon(){return svgTag('<polygon points="4,7 26,7 32,15 26,23 4,23 8,15" fill="#eaf4ff" stroke="#0a84ff" stroke-width="1.5"/>')}
function exceptionIcon(){return svgTag('<polygon points="12,4 24,4 32,12 32,20 24,28 12,28 4,20 4,12" fill="#fff5f4" stroke="#ff3b30" stroke-width="1.5"/>')}
function parallelIcon(){return svgTag('<rect x="5" y="9" width="26" height="12" rx="2" fill="#f5f0ff" stroke="#af52de" stroke-width="1.5"/><line x1="7" y1="6" x2="29" y2="6" stroke="#af52de" stroke-width="2" stroke-linecap="round"/><line x1="7" y1="24" x2="29" y2="24" stroke="#af52de" stroke-width="2" stroke-linecap="round"/>')}
function titleIcon(){return svgTag('<rect x="3" y="7" width="30" height="16" rx="3" fill="#f5f8ff" stroke="#0a84ff" stroke-width="1.3"/><rect x="3" y="7" width="3" height="16" fill="#0a84ff"/><line x1="10" y1="13" x2="28" y2="13" stroke="#1d1d1f" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="18" x2="22" y2="18" stroke="#a4b8d4" stroke-width="1.5" stroke-linecap="round"/>')}
function groupIcon(){return svgTag('<rect x="4" y="6" width="28" height="18" rx="4" fill="none" stroke="#0a84ff" stroke-width="1.5" stroke-dasharray="3 2"/><rect x="8" y="11" width="6" height="6" rx="1" fill="#0a84ff" opacity=".35"/><rect x="16" y="11" width="6" height="6" rx="1" fill="#0a84ff" opacity=".55"/><rect x="24" y="14" width="5" height="5" rx="1" fill="#0a84ff" opacity=".75"/>')}
function objectiveIcon(){return svgTag('<rect x="4" y="5" width="28" height="20" rx="3" fill="#fff" stroke="#5856d6" stroke-width="1.3"/><rect x="4" y="5" width="3" height="20" fill="#5856d6"/><line x1="10" y1="11" x2="28" y2="11" stroke="#5856d6" stroke-width="1.8" stroke-linecap="round"/><line x1="10" y1="16" x2="24" y2="16" stroke="#c9c6ea" stroke-width="1.4" stroke-linecap="round"/><line x1="10" y1="20" x2="20" y2="20" stroke="#c9c6ea" stroke-width="1.4" stroke-linecap="round"/>')}
function initiativeIcon(){return svgTag('<rect x="4" y="7" width="28" height="16" rx="2" fill="#fff" stroke="#ff9500" stroke-width="1.3"/><rect x="4" y="7" width="28" height="3" fill="#ff9500"/><circle cx="10" cy="17" r="2" fill="#ff9500"/><line x1="15" y1="17" x2="28" y2="17" stroke="#f0d9b8" stroke-width="1.4" stroke-linecap="round"/>')}

export const CARD_TYPES = {
  // Sticky notes
  sticky:     { group:'Sticky Notes', label:'Sticky',    icon:stickyIcon,    defaults:{ text:'New idea', w:180, h:130 } },
  note:       { group:'Sticky Notes', label:'Note',      icon:noteIcon,      defaults:{ text:'Note',     w:220, h:100 } },
  // Flow shapes
  process:    { group:'Flow Shapes',  label:'Process',   icon:rectIcon,      defaults:{ text:'Process',  w:160, h:80  } },
  decision:   { group:'Flow Shapes',  label:'Decision',  icon:diamondIcon,   defaults:{ text:'Decision', w:140, h:140 } },
  terminator: { group:'Flow Shapes',  label:'Start/End', icon:pillIcon,      defaults:{ text:'Start',    w:160, h:64  } },
  data:       { group:'Flow Shapes',  label:'Data',      icon:paraIcon,      defaults:{ text:'Data',     w:170, h:76  } },
  circle:     { group:'Flow Shapes',  label:'Node',      icon:circleIcon,    defaults:{ text:'Node',     w:100, h:100 } },
  delay:      { group:'Flow Shapes',  label:'Delay',     icon:delayIcon,     defaults:{ text:'Wait',     w:160, h:80  } },
  handoff:    { group:'Flow Shapes',  label:'Handoff',   icon:handoffIcon,   defaults:{ text:'Handoff',  w:170, h:74  } },
  exception:  { group:'Flow Shapes',  label:'Exception', icon:exceptionIcon, defaults:{ text:'Exception',w:130, h:130 } },
  parallel:   { group:'Flow Shapes',  label:'Parallel',  icon:parallelIcon,  defaults:{ text:'Parallel', w:170, h:80  } },
  title:      { group:'Flow Shapes',  label:'Title',     icon:titleIcon,     defaults:{ text:'Session title', subtitle:'Add a short subtitle', w:520, h:120 } },
  // Experience cards
  emotion:    { group:'Experience',   label:'Emotion',   icon:emotionIcon,   defaults:{ text:'Happy', emoji:'😊', w:120, h:120 } },
  quote:      { group:'Experience',   label:'Quote',     icon:quoteIcon,     defaults:{ text:'Type a customer quote…', w:220, h:96 } },
  pain:       { group:'Experience',   label:'Pain',      icon:painIcon,      defaults:{ text:'Pain point', w:190, h:64 } },
  gain:       { group:'Experience',   label:'Gain',      icon:gainIcon,      defaults:{ text:'Gain / opportunity', w:190, h:64 } },
  moment:     { group:'Experience',   label:'Moment',    icon:momentIcon,    defaults:{ text:'Journey moment', w:170, h:76 } },
  persona:    { group:'Experience',   label:'Persona',   icon:personaIcon,   defaults:{ text:'Name — role\nGoals · needs', w:200, h:110 } },
  // Prompt / discussion cards
  prompt:     { group:'Prompt',       label:'Prompt',    icon:promptIcon,     defaults:{ text:'Discussion prompt', w:320, h:180 } },
  // Attached only via the pain-point toggle — hidden from palette
  painscore:  { group:'_hidden',      label:'Pain Score', defaults:{ w:230, h:150 } },
  // Workflow primitives
  group:      { group:'Workflow',     label:'Group',     icon:groupIcon,     defaults:{ text:'Group name', w:340, h:220, color:'#0a84ff' } },
  objective:  { group:'Workflow',     label:'Objective', icon:objectiveIcon, defaults:{ text:'Objective title', why:'Why this matters', measure:'How we know it worked', w:300, h:170 } },
  initiative: { group:'Workflow',     label:'Initiative',icon:initiativeIcon,defaults:{ text:'Initiative name', hypothesis:'We believe … so that …', owner:'Owner', effort:'M', impact:3, horizon:'now', w:230, h:130 } },
};
