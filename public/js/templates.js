// Template packs
import { LANE_COLORS } from './constants.js';
import { uid } from './utils.js';

const SC = { yellow:'#fff59d', pink:'#f8bbd0', blue:'#bbdefb', green:'#c8e6c9', orange:'#ffe0b2', purple:'#e1bee7' };

export const TEMPLATE_PACKS = {
  sample: () => ({
    canvasType:'hswimlanes',
    lanes: [
      {id:'l1', name:'Discover', color:'#0a84ff'},
      {id:'l2', name:'Define',   color:'#af52de'},
      {id:'l3', name:'Ideate',   color:'#34c759'},
      {id:'l4', name:'Deliver',  color:'#ff9500'},
    ],
    prompts: [
      {category:'Users', text:'Who are our primary users and what jobs are they trying to get done?'},
      {category:'Users', text:'What frustrations do users experience today?'},
      {category:'Problem', text:'What is the core problem worth solving?'},
      {category:'Problem', text:'How do we measure success in 90 days?'},
      {category:'Solution', text:'What is the smallest thing we could ship to test the hypothesis?'},
      {category:'Risks', text:'What has to be true for this to work?'},
    ],
    cards: [
      {id:'k1', type:'terminator', x:120, y:80,  text:'Kickoff'},
      {id:'k2', type:'process',    x:360, y:80,  text:'User interviews'},
      {id:'k3', type:'sticky',     x:600, y:60,  text:'"I lose track of tasks across tools."', color:SC.yellow},
      {id:'k4', type:'decision',   x:860, y:60,  text:'Signal?'},
      {id:'k5', type:'process',    x:1080,y:500, text:'Synthesize insights'},
      {id:'k6', type:'sticky',     x:1340,y:500, text:'Insight: consolidation', color:SC.green},
      {id:'k7', type:'data',       x:600, y:920, text:'Concepts backlog'},
      {id:'k8', type:'process',    x:900, y:1300,text:'MVP build'},
      {id:'k9', type:'terminator', x:1200,y:1300,text:'Launch'},
    ],
    connections: [
      {id:'c1', from:'k1', to:'k2', fromAnchor:'right', toAnchor:'left'},
      {id:'c2', from:'k2', to:'k3', fromAnchor:'right', toAnchor:'left'},
      {id:'c3', from:'k3', to:'k4', fromAnchor:'right', toAnchor:'left'},
      {id:'c4', from:'k4', to:'k5', fromAnchor:'bottom', toAnchor:'top'},
      {id:'c5', from:'k5', to:'k6', fromAnchor:'right', toAnchor:'left'},
      {id:'c6', from:'k6', to:'k7', fromAnchor:'bottom', toAnchor:'top'},
      {id:'c7', from:'k7', to:'k8', fromAnchor:'bottom', toAnchor:'top'},
      {id:'c8', from:'k8', to:'k9', fromAnchor:'right', toAnchor:'left'},
    ],
    view: {x:20,y:20,scale:.7},
  }),

  ideation: () => {
    const colors = [SC.yellow, SC.pink, SC.blue, SC.green, SC.orange, SC.purple];
    const seeds = [
      'Wild idea: what if it were free?',
      'Automate the boring part',
      'Steal shamelessly from adjacent industries',
      'What would 10x look like?',
      'Remove a step entirely',
      'Reverse the assumption',
      'AI-assisted onboarding',
      'Community-led growth loop',
      'Ship in a weekend',
    ];
    const cards = seeds.map((t,i)=>({
      id:'i'+i, type:'sticky',
      x: 120 + (i%3)*260, y: 100 + Math.floor(i/3)*180,
      text:t, color: colors[i%colors.length],
    }));
    return {
      canvasType:'vswimlanes',
      lanes: [
        {id:'la', name:'Brainstorm',  color:'#ffcc00'},
        {id:'lb', name:'Cluster',     color:'#5ac8fa'},
        {id:'lc', name:'Prioritise',  color:'#34c759'},
        {id:'ld', name:'Next Steps',  color:'#ff2d55'},
      ],
      prompts: [
        {category:'Warm-up', text:'What would we build if we had unlimited resources?'},
        {category:'Warm-up', text:'What would we build if we had one week?'},
        {category:'Diverge', text:'List 10 wild ideas — no filters.'},
        {category:'Diverge', text:'Combine two existing products into something new.'},
        {category:'Converge', text:'Which idea excites the most people?'},
        {category:'Converge', text:'Which idea is riskiest but highest reward?'},
        {category:'Decide', text:'What is the smallest experiment we can run this week?'},
      ],
      cards,
      connections: [],
      view: {x:40,y:40,scale:.9},
    };
  },

  process: () => ({
    canvasType:'hswimlanes',
    lanes: [
      {id:'p1', name:'Customer',     color:'#0a84ff'},
      {id:'p2', name:'Frontstage',   color:'#34c759'},
      {id:'p3', name:'Backstage',    color:'#af52de'},
      {id:'p4', name:'Systems',      color:'#8e8e93'},
    ],
    prompts: [
      {category:'Scope', text:'Where does this process start and end?'},
      {category:'Actors', text:'Who is involved at each step?'},
      {category:'Handoffs', text:'Where do handoffs happen — and where do they break?'},
      {category:'Rules', text:'What decisions or approvals are required?'},
      {category:'Pain', text:'Which steps are slow, manual, or error-prone?'},
    ],
    cards: [
      {id:'p_a', type:'terminator', x:80,   y:120,  text:'Request submitted'},
      {id:'p_b', type:'process',    x:340,  y:120,  text:'Triage'},
      {id:'p_c', type:'decision',   x:600,  y:100,  text:'Approved?'},
      {id:'p_d', type:'process',    x:860,  y:540,  text:'Fulfil order'},
      {id:'p_e', type:'process',    x:600,  y:540,  text:'Notify customer'},
      {id:'p_f', type:'data',       x:1120, y:540,  text:'Order record'},
      {id:'p_g', type:'process',    x:340,  y:960,  text:'Assign owner'},
      {id:'p_h', type:'terminator', x:1120, y:960,  text:'Closed'},
      {id:'p_s1',type:'sticky',     x:80,   y:960,  text:'Manual step — automate?', color:SC.pink},
    ],
    connections: [
      {id:'pc1', from:'p_a', to:'p_b', fromAnchor:'right', toAnchor:'left'},
      {id:'pc2', from:'p_b', to:'p_c', fromAnchor:'right', toAnchor:'left'},
      {id:'pc3', from:'p_c', to:'p_d', fromAnchor:'bottom', toAnchor:'top'},
      {id:'pc4', from:'p_c', to:'p_e', fromAnchor:'bottom', toAnchor:'top'},
      {id:'pc5', from:'p_d', to:'p_f', fromAnchor:'right', toAnchor:'left'},
      {id:'pc6', from:'p_e', to:'p_g', fromAnchor:'bottom', toAnchor:'top'},
      {id:'pc7', from:'p_d', to:'p_h', fromAnchor:'bottom', toAnchor:'top'},
    ],
    view:{x:20,y:20,scale:.7},
  }),

  experience: () => ({
    canvasType:'hswimlanes',
    lanes: [
      {id:'e1', name:'Stages',       color:'#0a84ff'},
      {id:'e2', name:'Actions',      color:'#5ac8fa'},
      {id:'e3', name:'Thoughts',     color:'#af52de'},
      {id:'e4', name:'Emotions',     color:'#ff2d55'},
      {id:'e5', name:'Opportunities',color:'#34c759'},
    ],
    prompts: [
      {category:'Stage', text:'What are the key stages of the journey?'},
      {category:'Action', text:'What is the user doing at each stage?'},
      {category:'Thought', text:'What are they thinking or asking themselves?'},
      {category:'Emotion', text:'How do they feel — and where does it peak or dip?'},
      {category:'Moment', text:'Where are the moments of truth?'},
      {category:'Opportunity', text:'Where could we delight, reassure, or remove friction?'},
    ],
    cards: [
      {id:'e_s1', type:'terminator', x:100,  y:120, text:'Awareness'},
      {id:'e_s2', type:'terminator', x:420,  y:120, text:'Consideration'},
      {id:'e_s3', type:'terminator', x:740,  y:120, text:'Sign-up'},
      {id:'e_s4', type:'terminator', x:1060, y:120, text:'First use'},
      {id:'e_s5', type:'terminator', x:1380, y:120, text:'Advocate'},
      {id:'e_a1', type:'process', x:100,  y:520, text:'Sees an ad'},
      {id:'e_a2', type:'process', x:420,  y:520, text:'Reads reviews'},
      {id:'e_a3', type:'process', x:740,  y:520, text:'Creates account'},
      {id:'e_a4', type:'process', x:1060, y:520, text:'Completes first task'},
      {id:'e_a5', type:'process', x:1380, y:520, text:'Refers a friend'},
      {id:'e_t1', type:'sticky', x:100,  y:920, text:'Is this for me?', color:SC.blue},
      {id:'e_t2', type:'sticky', x:420,  y:920, text:'Can I trust this?', color:SC.blue},
      {id:'e_t3', type:'sticky', x:740,  y:920, text:'Why so many fields?', color:SC.blue},
      {id:'e_t4', type:'sticky', x:1060, y:920, text:'What do I do first?', color:SC.blue},
      {id:'e_t5', type:'sticky', x:1380, y:920, text:'My team should see this.', color:SC.blue},
      {id:'e_e1', type:'sticky', x:100,  y:1300, text:'😐 Curious', color:SC.orange},
      {id:'e_e2', type:'sticky', x:420,  y:1300, text:'🤔 Skeptical', color:SC.pink},
      {id:'e_e3', type:'sticky', x:740,  y:1300, text:'😤 Frustrated', color:SC.pink},
      {id:'e_e4', type:'sticky', x:1060, y:1300, text:'😊 Relieved', color:SC.green},
      {id:'e_e5', type:'sticky', x:1380, y:1300, text:'🤩 Delighted', color:SC.green},
      {id:'e_o1', type:'sticky', x:420,  y:1700, text:'Add social proof', color:SC.yellow},
      {id:'e_o2', type:'sticky', x:740,  y:1700, text:'Cut fields; use SSO', color:SC.yellow},
      {id:'e_o3', type:'sticky', x:1060, y:1700, text:'Guided first-run', color:SC.yellow},
      {id:'e_o4', type:'sticky', x:1380, y:1700, text:'Built-in referral', color:SC.yellow},
    ],
    connections: [
      {id:'ec1', from:'e_s1', to:'e_s2', fromAnchor:'right', toAnchor:'left'},
      {id:'ec2', from:'e_s2', to:'e_s3', fromAnchor:'right', toAnchor:'left'},
      {id:'ec3', from:'e_s3', to:'e_s4', fromAnchor:'right', toAnchor:'left'},
      {id:'ec4', from:'e_s4', to:'e_s5', fromAnchor:'right', toAnchor:'left'},
    ],
    view:{x:20,y:20,scale:.55},
  }),

  empathy: () => ({
    canvasType:'empathy',
    lanes: [],
    prompts: [
      {category:'Says',   text:'What quotes and words did they use?'},
      {category:'Thinks', text:'What might they be thinking but not saying?'},
      {category:'Does',   text:'What actions and behaviours did we observe?'},
      {category:'Feels',  text:'What emotions might they be experiencing?'},
      {category:'Pains',  text:'What are their fears, frustrations, obstacles?'},
      {category:'Gains',  text:'What do they hope to achieve?'},
    ],
    cards: [
      {id:'em1', type:'sticky', x:260,  y:140, text:'"I never know if it worked."', color:SC.blue},
      {id:'em2', type:'sticky', x:900,  y:140, text:'"Am I doing this right?"',      color:SC.purple},
      {id:'em3', type:'sticky', x:260,  y:600, text:'Refreshes page repeatedly',    color:SC.green},
      {id:'em4', type:'sticky', x:900,  y:600, text:'Anxious before deadlines',     color:SC.pink},
      {id:'em5', type:'sticky', x:260,  y:1060,text:'Fear of breaking production',  color:SC.pink},
      {id:'em6', type:'sticky', x:900,  y:1060,text:'Wants confidence to ship fast',color:SC.yellow},
    ],
    connections: [],
    view:{x:40,y:40,scale:.7},
  }),

  retro: () => ({
    canvasType:'vswimlanes',
    lanes: [
      {id:'r1', name:'Went well',       color:'#34c759'},
      {id:'r2', name:'Didn\'t go well', color:'#ff2d55'},
      {id:'r3', name:'Ideas',           color:'#ffcc00'},
      {id:'r4', name:'Actions',         color:'#0a84ff'},
    ],
    prompts: [
      {category:'Retro', text:'What should we start doing?'},
      {category:'Retro', text:'What should we stop doing?'},
      {category:'Retro', text:'What should we continue doing?'},
      {category:'Retro', text:'What surprised us this cycle?'},
    ],
    cards: [
      {id:'r_a', type:'sticky', x:120,  y:120, text:'Shipped on time', color:SC.green},
      {id:'r_b', type:'sticky', x:120,  y:520, text:'Standups too long', color:SC.pink},
      {id:'r_c', type:'sticky', x:120,  y:920, text:'Try pair programming Fridays', color:SC.yellow},
      {id:'r_d', type:'sticky', x:120,  y:1320,text:'Timebox standups to 10min', color:SC.blue},
    ],
    connections: [],
    view:{x:40,y:40,scale:.9},
  }),

  backcast: () => ({
    canvasType:'backcast',
    lanes: [
      {id:'bc_h',  name:'Future State Vision (12–24 months)', color:'#ff2d55'},
      {id:'bc_l1', name:'Today (Starting Point)',             color:'#8e8e93'},
      {id:'bc_l2', name:'Enablers & Guardrails',              color:'#5856d6'},
      {id:'bc_l3', name:'Signals & Evidence',                 color:'#0a84ff'},
      {id:'bc_l4', name:'What Had To Be True',                color:'#ff9500'},
      {id:'bc_l5', name:'Future Outcome',                     color:'#ff2d55'},
    ],
    prompts: [
      {category:'Future Outcome', text:'Describe the future headline: what does "good" look like 12–24 months from now?', notes:'Anchor on the outcome we want to stand behind — specific, dated, defensible.'},
      {category:'What Had To Be True', text:'For that outcome to be real, what had to be true across people, product, policy and partners?', notes:'Work rightward-to-leftward. Force a small set of load-bearing conditions, not a wish list.'},
      {category:'Signals & Evidence', text:'What early signals would prove — or disprove — that each condition is holding?', notes:'Separate evidence you could gather now from evidence you would need to build.'},
      {category:'Enablers & Guardrails', text:'What capabilities, decisions and guardrails make those conditions safe to pursue?', notes:'Name the responsible-AI guardrails, governance, and enabling investments explicitly.'},
      {category:'Today', text:'Where are we honestly today against each condition — and what is the first responsible move?', notes:'Force a truthful baseline. Small, credible next moves beat grand plans.'},
    ],
    cards: [
      {id:'bc_title', type:'title', x:220, y:24, text:'Future-State Backcast', subtitle:'Working backwards from the outcome we want to stand behind'},
      {id:'bc_out1', type:'sticky', x:3260, y:220, text:'Headline outcome we want to be true in 18 months', color:SC.pink},
      {id:'bc_out2', type:'sticky', x:3260, y:440, text:'Who benefits, and how we would know', color:SC.pink},
      {id:'bc_out3', type:'sticky', x:3260, y:660, text:'What we are willing to publicly commit to', color:SC.pink},
      {id:'bc_wht1', type:'sticky', x:2460, y:220, text:'Condition 1 — people & skills', color:SC.orange},
      {id:'bc_wht2', type:'sticky', x:2460, y:440, text:'Condition 2 — product & data', color:SC.orange},
      {id:'bc_wht3', type:'sticky', x:2460, y:660, text:'Condition 3 — policy & trust', color:SC.orange},
      {id:'bc_wht4', type:'sticky', x:2460, y:880, text:'Condition 4 — partners & channels', color:SC.orange},
      {id:'bc_sig1', type:'sticky', x:1660, y:220, text:'Leading signal we can measure now', color:SC.blue},
      {id:'bc_sig2', type:'sticky', x:1660, y:440, text:'Evidence we would need to build', color:SC.blue},
      {id:'bc_sig3', type:'sticky', x:1660, y:660, text:'What would make us stop or pivot', color:SC.blue},
      {id:'bc_en1', type:'sticky',  x:860,  y:220, text:'Capability / investment enabler', color:SC.purple},
      {id:'bc_en2', type:'sticky',  x:860,  y:440, text:'Responsible-AI guardrail', color:SC.purple},
      {id:'bc_en3', type:'decision',x:860,  y:660, text:'Key decision or approval'},
      {id:'bc_td1', type:'sticky',  x:80,   y:220, text:'Where we honestly are today', color:SC.yellow},
      {id:'bc_td2', type:'sticky',  x:80,   y:440, text:'First responsible move (this quarter)', color:SC.yellow},
      {id:'bc_td3', type:'terminator', x:80, y:660, text:'Start'},
    ],
    connections: [
      {id:'bcc1', from:'bc_td1',  to:'bc_en1',  fromAnchor:'right', toAnchor:'left'},
      {id:'bcc2', from:'bc_td2',  to:'bc_en2',  fromAnchor:'right', toAnchor:'left'},
      {id:'bcc3', from:'bc_en1',  to:'bc_sig1', fromAnchor:'right', toAnchor:'left'},
      {id:'bcc4', from:'bc_en2',  to:'bc_sig2', fromAnchor:'right', toAnchor:'left'},
      {id:'bcc5', from:'bc_sig1', to:'bc_wht1', fromAnchor:'right', toAnchor:'left'},
      {id:'bcc6', from:'bc_sig2', to:'bc_wht2', fromAnchor:'right', toAnchor:'left'},
      {id:'bcc7', from:'bc_sig3', to:'bc_wht3', fromAnchor:'right', toAnchor:'left'},
      {id:'bcc8', from:'bc_wht1', to:'bc_out1', fromAnchor:'right', toAnchor:'left'},
      {id:'bcc9', from:'bc_wht2', to:'bc_out2', fromAnchor:'right', toAnchor:'left'},
      {id:'bcc10',from:'bc_wht3', to:'bc_out3', fromAnchor:'right', toAnchor:'left'},
    ],
    view:{x:20,y:20,scale:.45},
  }),

  frontier: () => ({
    multi:true,
    session:{
      title:'Frontier Action Plan',
      customer:'', date:new Date().toISOString().slice(0,10),
      sessionType:'Strategy workshop',
      description:'Diverge on the future, cluster ideas, form objectives, define initiatives, then sequence a plan on a page.',
    },
    stages:[
      {
        name:'1. Future', stageKind:'future', canvasType:'backcast',
        description:'Envision the future state and work back to what has to be true.',
        lanes:[], prompts:[
          {id:'fp1', category:'Future', text:'A year from now, what does success look like? What is different?', notes:'Encourage bold, specific statements. Multiple ideas welcome — no need to reconcile yet.'},
          {id:'fp2', category:'Signals',text:'What signals or evidence would prove we\'re there?', notes:'Prompts observable outcomes rather than activity.'},
        ],
        cards:[
          {id:'ft_title', type:'title', x:800, y:60, text:'Frontier Action Plan', subtitle:'Stage 1 — Envision the future state'},
        ],
        connections:[], view:{x:20,y:20,scale:.5},
      },
      {
        name:'2. Cluster', stageKind:'cluster', canvasType:'cluster',
        description:'Group related ideas. Drag stickies into a Group frame to associate them.',
        lanes:[], prompts:[
          {id:'cp1', category:'Cluster', text:'What themes emerge across the future-state ideas?', notes:'Aim for 3–6 groups. Name each group in a short verb phrase.'},
        ],
        cards:[
          {id:'cl_g1', type:'group', x:120,  y:160, text:'Theme A', color:'#0a84ff', w:360, h:260},
          {id:'cl_g2', type:'group', x:520,  y:160, text:'Theme B', color:'#5856d6', w:360, h:260},
          {id:'cl_g3', type:'group', x:920,  y:160, text:'Theme C', color:'#ff9500', w:360, h:260},
        ],
        connections:[], view:{x:20,y:20,scale:.7},
      },
      {
        name:'3. Objectives', stageKind:'objectives', canvasType:'objectives',
        description:'Turn each group into a clear outcome statement with a measure.',
        lanes:[], prompts:[
          {id:'op1', category:'Objectives', text:'For each group, what outcome do we commit to? How will we know?', notes:'Format: verb + outcome + measure. Promote the ones that make the plan.'},
        ],
        cards:[], connections:[], view:{x:20,y:20,scale:.7},
      },
      {
        name:'4. Initiatives', stageKind:'initiatives', canvasType:'initiatives',
        description:'Under each promoted objective, define initiatives that move the needle.',
        lanes:[], prompts:[
          {id:'ip1', category:'Initiatives', text:'What are the 2–4 initiatives that most credibly deliver each objective?', notes:'Capture owner, effort (S/M/L), impact (1–5) and horizon (now/next/later).'},
        ],
        cards:[], connections:[], view:{x:20,y:20,scale:.7},
      },
      {
        name:'5. Plan', stageKind:'plan', canvasType:'plan',
        description:'Sequence the initiatives across Now / Next / Later.',
        lanes:[], prompts:[
          {id:'pp1', category:'Plan', text:'What must we start now to unlock next and later?', notes:'Highlight dependencies. Anything without an owner is a wish, not a plan.'},
        ],
        cards:[
          {id:'pl_title', type:'title', x:600, y:20, text:'Plan on a Page', subtitle:'Now · Next · Later'},
        ],
        connections:[], view:{x:20,y:20,scale:.5},
      },
    ],
  }),
};
