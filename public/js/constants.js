// Constants and configuration
export const WORLD_W = 2400;
export const WORLD_H = 1600;

export const STORAGE_KEY = 'discovery-canvas-v3-mindmap';

export const LANE_COLORS = ['#0a84ff','#34c759','#ff9500','#af52de','#ff2d55','#5ac8fa','#ffcc00'];

export const STICKY_COLORS = [
  {name:'Yellow', color:'#fff59d'},
  {name:'Pink',   color:'#f8bbd0'},
  {name:'Blue',   color:'#bbdefb'},
  {name:'Green',  color:'#c8e6c9'},
  {name:'Orange', color:'#ffe0b2'},
  {name:'Purple', color:'#e1bee7'},
];

export const EMOTION_PRESETS = [
  {emoji:'😊', label:'Delighted', color:'#c8e6c9'},
  {emoji:'🙂', label:'Content',   color:'#dcedc8'},
  {emoji:'😐', label:'Neutral',   color:'#eeeeee'},
  {emoji:'😕', label:'Confused',  color:'#ffe0b2'},
  {emoji:'😟', label:'Worried',   color:'#ffccbc'},
  {emoji:'😣', label:'Frustrated',color:'#ffcdd2'},
];

export const CANVAS_META = {
  whiteboard:  { label:'Freestyle'             },
  hswimlanes:  { label:'Swimlanes'             },
  vswimlanes:  { label:'Vertical Swimlanes'    },
  matrix2x2:   { label:'2×2 Matrix'            },
  raci:        { label:'RACI Matrix'           },
  strategy:    { label:'Strategy on a Page'    },
  journey:     { label:'Journey Map'           },
  empathy:     { label:'Empathy Map'           },
  mindmap:     { label:'Mind Map'              },
  backcast:    { label:'Future-State Backcast' },
  usecase:     { label:'Use Case Ideation'     },
  cluster:     { label:'Cluster & Group'       },
  objectives:  { label:'Objectives'            },
  initiatives: { label:'Initiatives'           },
  plan:        { label:'Action Plan'           },
};

export const CANVAS_TYPE_ALIASES = {
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
  'use-case':'usecase','use-cases':'usecase','use-case-ideation':'usecase',
  'usecase-ideation':'usecase','ideation-usecase':'usecase','ai-use-case':'usecase','opportunity':'usecase',
};

export const SMART_EXPORT = {
  whiteboard:'png', mindmap:'png', matrix2x2:'png', journey:'pdf', empathy:'pdf',
  hswimlanes:'pdf', vswimlanes:'pdf', raci:'docx', strategy:'docx', backcast:'docx', usecase:'docx',
  cluster:'png', objectives:'docx', initiatives:'docx', plan:'docx',
};

export const EXPORT_LABELS = { png:'PNG snapshot', pdf:'PDF structured report', docx:'Word (.docx) report', json:'JSON session data' };

export const ACTIVITY_TYPE_CANVAS = {
  'divergent-ideation':'whiteboard','brainstorm':'whiteboard','brainstorming':'whiteboard','sticky-storm':'whiteboard',
  'affinity':'mindmap','affinity-mapping':'mindmap','clustering':'mindmap',
  'mindmap':'mindmap','mind-map':'mindmap',
  'convergent-ideation':'matrix2x2','prioritisation':'matrix2x2','prioritization':'matrix2x2',
  '2x2':'matrix2x2','2x2-prioritisation':'matrix2x2','impact-effort':'matrix2x2',
  'dot-vote':'matrix2x2','decision':'matrix2x2',
  'empathy':'empathy','empathy-map':'empathy',
  'journey':'journey','journey-map':'journey','experience-map':'journey','service-blueprint':'journey',
  'process-map':'hswimlanes','process-mapping':'hswimlanes','workflow':'hswimlanes','swimlane':'hswimlanes','swimlanes':'hswimlanes',
  'raci':'raci',
  'retro':'vswimlanes','retrospective':'vswimlanes','reflection':'vswimlanes',
  'strategy-on-a-page':'strategy','strategy':'strategy','okrs':'strategy','okr':'strategy','vision':'strategy',
  'future-state':'backcast','future-state-vision':'backcast','future-back':'backcast',
  'backcast':'backcast','backcasting':'backcast','working-backwards':'backcast',
  'pre-mortem':'backcast','premortem':'backcast','what-had-to-be-true':'backcast','responsible-ai':'backcast',
  'use-case':'usecase','usecase':'usecase','use-case-ideation':'usecase','opportunity-canvas':'usecase',
  'ai-use-case':'usecase','opportunity':'usecase','ideation-use-case':'usecase',
};

export const WORKFLOW_STAGES = [
  {kind:'future',      short:'1. Future',      label:'Envision the future state'},
  {kind:'cluster',     short:'2. Cluster',     label:'Group related ideas'},
  {kind:'objectives',  short:'3. Objectives',  label:'Form objectives from groups'},
  {kind:'initiatives', short:'4. Initiatives', label:'Define initiatives per objective'},
  {kind:'plan',        short:'5. Plan',        label:'Sequence on a page'},
];

// Shorthand color aliases for templates
export const SC = { yellow:'#fff59d', pink:'#f8bbd0', blue:'#bbdefb', green:'#c8e6c9', orange:'#ffe0b2', purple:'#e1bee7' };
