// Template packs — every scenario is a real-world AI / agentic example
import { LANE_COLORS } from './constants.js';
import { uid } from './utils.js';

const SC = { yellow:'#fff59d', pink:'#f8bbd0', blue:'#bbdefb', green:'#c8e6c9', orange:'#ffe0b2', purple:'#e1bee7' };

export const TEMPLATE_PACKS = {
  // Real-world scenario: discovery for an AI meeting-assistant agent
  sample: () => ({
    canvasType:'hswimlanes',
    lanes: [
      {id:'l1', name:'Discover', color:'#0a84ff'},
      {id:'l2', name:'Define',   color:'#af52de'},
      {id:'l3', name:'Ideate',   color:'#34c759'},
      {id:'l4', name:'Deliver',  color:'#ff9500'},
    ],
    prompts: [
      {category:'Users', text:'Which teams would rely on an AI meeting assistant, and what outcomes do they expect from it?'},
      {category:'Users', text:'What do people do today after a meeting that the agent could quietly take off their plate?'},
      {category:'Problem', text:'Where do current recap tools fall short — accuracy, trust, action follow-through?'},
      {category:'Problem', text:'What does "the agent earned its seat" look like in 90 days?'},
      {category:'Solution', text:'What is the smallest agentic loop we could ship — listen, summarise, propose actions, ask for approval?'},
      {category:'Risks', text:'What must be true for legal, security and participants to trust the agent in the room?'},
    ],
    cards: [
      {id:'k1', type:'terminator', x:120, y:80,  text:'Kickoff: AI meeting assistant'},
      {id:'k2', type:'process',    x:360, y:80,  text:'Shadow 6 recurring meetings'},
      {id:'k3', type:'sticky',     x:600, y:60,  text:'"I rewrite the AI notes every time — I don\'t trust them yet."', color:SC.yellow},
      {id:'k4', type:'decision',   x:860, y:60,  text:'Signal strong enough to pilot?'},
      {id:'k5', type:'process',    x:1080,y:500, text:'Synthesise into agent job-map'},
      {id:'k6', type:'sticky',     x:1340,y:500, text:'Insight: value is in owned follow-ups, not transcripts', color:SC.green},
      {id:'k7', type:'data',       x:600, y:920, text:'Prompt + tool-call backlog'},
      {id:'k8', type:'process',    x:900, y:1300,text:'Ship human-in-the-loop MVP'},
      {id:'k9', type:'terminator', x:1200,y:1300,text:'Pilot with 3 teams'},
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

  // Real-world scenario: brainstorming agentic AI ideas for customer support
  ideation: () => {
    const colors = [SC.yellow, SC.pink, SC.blue, SC.green, SC.orange, SC.purple];
    const seeds = [
      'Agent that drafts refund decisions with policy citations',
      'Auto-triage inbound tickets by intent + urgency',
      'Voice agent that handles password resets end-to-end',
      'Copilot that suggests the next best reply to the human agent',
      'Proactive outreach when a customer\'s usage drops',
      'Agent that stitches CRM + billing + logs into one answer',
      'Self-serve "explain my invoice" agent',
      'Post-call QA agent that scores empathy and accuracy',
      'Escalation agent that writes the handoff brief for L2',
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
        {category:'Warm-up', text:'If an agent could take one repetitive task off support tomorrow, what should it be?'},
        {category:'Warm-up', text:'What would we automate if hallucinations were a solved problem?'},
        {category:'Diverge', text:'List 10 places an agent could act on behalf of the customer — no filters.'},
        {category:'Diverge', text:'Combine two internal tools into a single agentic workflow.'},
        {category:'Converge', text:'Which idea most reduces handle time without hurting CSAT?'},
        {category:'Converge', text:'Which idea is riskiest but highest reward if it works?'},
        {category:'Decide', text:'What is the smallest agentic experiment we can put in front of real customers this week?'},
      ],
      cards,
      connections: [],
      view: {x:40,y:40,scale:.9},
    };
  },

  // Real-world scenario: AI-augmented loan approval process
  process: () => ({
    canvasType:'hswimlanes',
    lanes: [
      {id:'p1', name:'Customer',     color:'#0a84ff'},
      {id:'p2', name:'AI Agent',     color:'#34c759'},
      {id:'p3', name:'Human Reviewer',color:'#af52de'},
      {id:'p4', name:'Core Systems', color:'#8e8e93'},
    ],
    prompts: [
      {category:'Scope', text:'Where does the loan-approval journey start and end once an agent is in the loop?'},
      {category:'Actors', text:'Which decisions belong to the agent, which to the human, and which to the system of record?'},
      {category:'Handoffs', text:'Where does the agent hand off to a human — and how does it explain itself?'},
      {category:'Rules', text:'What policies must the agent cite before approving or declining?'},
      {category:'Pain', text:'Which steps today are slow, manual or error-prone that an agent could safely absorb?'},
    ],
    cards: [
      {id:'p_a', type:'terminator', x:80,   y:120,  text:'Customer submits loan application'},
      {id:'p_b', type:'process',    x:340,  y:120,  text:'Agent extracts + validates documents'},
      {id:'p_c', type:'decision',   x:600,  y:100,  text:'Confidence ≥ threshold?'},
      {id:'p_d', type:'process',    x:860,  y:540,  text:'Agent drafts approval with rationale'},
      {id:'p_e', type:'process',    x:600,  y:540,  text:'Route to human underwriter'},
      {id:'p_f', type:'data',       x:1120, y:540,  text:'Decision + audit log'},
      {id:'p_g', type:'process',    x:340,  y:960,  text:'Notify customer with explanation'},
      {id:'p_h', type:'terminator', x:1120, y:960,  text:'Funded'},
      {id:'p_s1',type:'sticky',     x:80,   y:960,  text:'Manual doc chase — prime candidate for agent', color:SC.pink},
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

  // Real-world scenario: developer adopting an AI coding copilot
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
      {category:'Stage', text:'What are the key moments in a developer adopting an AI coding copilot?'},
      {category:'Action', text:'What is the developer actually doing at each stage — prompting, reviewing, accepting, rejecting?'},
      {category:'Thought', text:'What are they asking themselves about accuracy, ownership and IP?'},
      {category:'Emotion', text:'Where does trust peak — and where does it collapse?'},
      {category:'Moment', text:'Where are the moments of truth that decide "I keep it on" vs "I turn it off"?'},
      {category:'Opportunity', text:'Where could the copilot reassure, explain itself, or gracefully step back?'},
    ],
    cards: [
      {id:'e_s1', type:'terminator', x:100,  y:120, text:'Hears about copilot'},
      {id:'e_s2', type:'terminator', x:420,  y:120, text:'Installs & signs in'},
      {id:'e_s3', type:'terminator', x:740,  y:120, text:'First real suggestion'},
      {id:'e_s4', type:'terminator', x:1060, y:120, text:'First PR shipped with it'},
      {id:'e_s5', type:'terminator', x:1380, y:120, text:'Becomes advocate'},
      {id:'e_a1', type:'process', x:100,  y:520, text:'Reads a teammate\'s Slack post'},
      {id:'e_a2', type:'process', x:420,  y:520, text:'Signs in with SSO, picks a repo'},
      {id:'e_a3', type:'process', x:740,  y:520, text:'Accepts a 12-line completion'},
      {id:'e_a4', type:'process', x:1060, y:520, text:'Merges a copilot-assisted PR'},
      {id:'e_a5', type:'process', x:1380, y:520, text:'Runs a lunch-and-learn'},
      {id:'e_t1', type:'sticky', x:100,  y:920, text:'Will it leak our code?', color:SC.blue},
      {id:'e_t2', type:'sticky', x:420,  y:920, text:'Is my repo really private in this thing?', color:SC.blue},
      {id:'e_t3', type:'sticky', x:740,  y:920, text:'Did it just make that API up?', color:SC.blue},
      {id:'e_t4', type:'sticky', x:1060, y:920, text:'Do I still own this diff?', color:SC.blue},
      {id:'e_t5', type:'sticky', x:1380, y:920, text:'My whole team should have this.', color:SC.blue},
      {id:'e_e1', type:'sticky', x:100,  y:1300, text:'🤨 Curious but wary', color:SC.orange},
      {id:'e_e2', type:'sticky', x:420,  y:1300, text:'😟 Nervous about IP', color:SC.pink},
      {id:'e_e3', type:'sticky', x:740,  y:1300, text:'😤 Burned by a hallucination', color:SC.pink},
      {id:'e_e4', type:'sticky', x:1060, y:1300, text:'😊 Genuinely faster', color:SC.green},
      {id:'e_e5', type:'sticky', x:1380, y:1300, text:'🤩 Wouldn\'t code without it', color:SC.green},
      {id:'e_o1', type:'sticky', x:420,  y:1700, text:'Show data-handling policy in-product', color:SC.yellow},
      {id:'e_o2', type:'sticky', x:740,  y:1700, text:'Cite sources for every suggestion', color:SC.yellow},
      {id:'e_o3', type:'sticky', x:1060, y:1700, text:'One-click "why did you suggest this?"', color:SC.yellow},
      {id:'e_o4', type:'sticky', x:1380, y:1700, text:'Team leaderboard of accepted diffs', color:SC.yellow},
    ],
    connections: [
      {id:'ec1', from:'e_s1', to:'e_s2', fromAnchor:'right', toAnchor:'left'},
      {id:'ec2', from:'e_s2', to:'e_s3', fromAnchor:'right', toAnchor:'left'},
      {id:'ec3', from:'e_s3', to:'e_s4', fromAnchor:'right', toAnchor:'left'},
      {id:'ec4', from:'e_s4', to:'e_s5', fromAnchor:'right', toAnchor:'left'},
    ],
    view:{x:20,y:20,scale:.55},
  }),

  // Real-world scenario: empathy map for a developer working with a coding agent
  empathy: () => ({
    canvasType:'empathy',
    lanes: [],
    prompts: [
      {category:'Says',   text:'What quotes do developers use about the coding agent?'},
      {category:'Thinks', text:'What might they be thinking about trust, IP and their own role?'},
      {category:'Does',   text:'What behaviours do we observe when the agent is on vs off?'},
      {category:'Feels',  text:'What emotions arise when the agent gets it right — and when it doesn\'t?'},
      {category:'Pains',  text:'What are their fears, frustrations and obstacles with agentic tools?'},
      {category:'Gains',  text:'What do they hope to achieve if the agent actually works?'},
    ],
    cards: [
      {id:'em1', type:'sticky', x:260,  y:140, text:'"I still re-read every line it writes."', color:SC.blue},
      {id:'em2', type:'sticky', x:900,  y:140, text:'"Am I becoming a reviewer instead of an engineer?"', color:SC.purple},
      {id:'em3', type:'sticky', x:260,  y:600, text:'Turns the agent off in sensitive repos', color:SC.green},
      {id:'em4', type:'sticky', x:900,  y:600, text:'Anxious before shipping AI-written code', color:SC.pink},
      {id:'em5', type:'sticky', x:260,  y:1060,text:'Fear of subtle bugs slipping past review', color:SC.pink},
      {id:'em6', type:'sticky', x:900,  y:1060,text:'Wants to ship 2× without losing craft', color:SC.yellow},
    ],
    connections: [],
    view:{x:40,y:40,scale:.7},
  }),

  // Real-world scenario: retro on our first AI agent pilot
  retro: () => ({
    canvasType:'vswimlanes',
    lanes: [
      {id:'r1', name:'Went well',       color:'#34c759'},
      {id:'r2', name:'Didn\'t go well', color:'#ff2d55'},
      {id:'r3', name:'Ideas',           color:'#ffcc00'},
      {id:'r4', name:'Actions',         color:'#0a84ff'},
    ],
    prompts: [
      {category:'Retro', text:'What should we start doing now that we\'ve run a real agent in production?'},
      {category:'Retro', text:'What should we stop doing — prompts, tools, guardrails that didn\'t earn their keep?'},
      {category:'Retro', text:'What should we continue — the habits that made the pilot land?'},
      {category:'Retro', text:'What surprised us about how users treated the agent?'},
    ],
    cards: [
      {id:'r_a', type:'sticky', x:120,  y:120, text:'Human-in-the-loop kept trust high', color:SC.green},
      {id:'r_b', type:'sticky', x:120,  y:520, text:'Eval harness was an afterthought — bit us', color:SC.pink},
      {id:'r_c', type:'sticky', x:120,  y:920, text:'Try tool-call tracing dashboards for support', color:SC.yellow},
      {id:'r_d', type:'sticky', x:120,  y:1320,text:'Own an evals-first workflow before next pilot', color:SC.blue},
    ],
    connections: [],
    view:{x:40,y:40,scale:.9},
  }),

  // Real-world scenario: responsible-AI newsroom summariser 18 months from now
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
      {category:'Future Outcome', text:'In 18 months, our AI newsroom summariser is trusted enough to run unsupervised on Tier-2 stories — what does that headline read like?', notes:'Anchor on an outcome we\'d publicly commit to — specific, dated, defensible.'},
      {category:'What Had To Be True', text:'For a trusted agentic summariser, what had to be true across editors, models, policy and audience?', notes:'Force a small set of load-bearing conditions, not a wish list.'},
      {category:'Signals & Evidence', text:'What early signals would prove — or disprove — that the agent is actually safe to publish from?', notes:'Separate signals we can gather now from signals we\'d need to build.'},
      {category:'Enablers & Guardrails', text:'What responsible-AI guardrails, evals and governance make the summariser safe to ship?', notes:'Name the guardrails explicitly — provenance, human review thresholds, kill switches.'},
      {category:'Today', text:'Honestly, where are we today against each condition — and what is the first responsible move this quarter?', notes:'A truthful baseline beats a grand plan.'},
    ],
    cards: [
      {id:'bc_title', type:'title', x:220, y:24, text:'Responsible AI Newsroom Summariser', subtitle:'Working backwards from an agent we\'d trust to publish Tier-2 stories in 18 months'},
      {id:'bc_out1', type:'sticky', x:3260, y:220, text:'Agent-drafted Tier-2 stories publish with editor sign-off in <5 min', color:SC.pink},
      {id:'bc_out2', type:'sticky', x:3260, y:440, text:'Audience trust scores hold vs human-only baseline', color:SC.pink},
      {id:'bc_out3', type:'sticky', x:3260, y:660, text:'Zero material factual corrections traced to the agent', color:SC.pink},
      {id:'bc_wht1', type:'sticky', x:2460, y:220, text:'Editors trained to review agent output at speed', color:SC.orange},
      {id:'bc_wht2', type:'sticky', x:2460, y:440, text:'Retrieval grounded in vetted sources only', color:SC.orange},
      {id:'bc_wht3', type:'sticky', x:2460, y:660, text:'Provenance + disclosure policy signed off by legal', color:SC.orange},
      {id:'bc_wht4', type:'sticky', x:2460, y:880, text:'Wire-service partners agree to attribution model', color:SC.orange},
      {id:'bc_sig1', type:'sticky', x:1660, y:220, text:'Editor time-to-publish trending down week-over-week', color:SC.blue},
      {id:'bc_sig2', type:'sticky', x:1660, y:440, text:'Hallucination rate < 1% on nightly eval set', color:SC.blue},
      {id:'bc_sig3', type:'sticky', x:1660, y:660, text:'Any Tier-1 correction attributed to the agent → pause', color:SC.blue},
      {id:'bc_en1', type:'sticky',  x:860,  y:220, text:'Grounded-generation stack + retrieval evals', color:SC.purple},
      {id:'bc_en2', type:'sticky',  x:860,  y:440, text:'Editor-in-the-loop UI with per-claim citations', color:SC.purple},
      {id:'bc_en3', type:'decision',x:860,  y:660, text:'Editorial board approves scope of Tier-2 use'},
      {id:'bc_td1', type:'sticky',  x:80,   y:220, text:'Today: agent used only for internal briefings', color:SC.yellow},
      {id:'bc_td2', type:'sticky',  x:80,   y:440, text:'This quarter: shadow-mode on Tier-3 with editor review', color:SC.yellow},
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

  // Real-world scenario: Frontier Action Plan for agentic customer support
  frontier: () => {
    const zoneW = 440, zoneH = 1180, gap = 40, top = 180;
    const zones = [
      {id:'fz_future',      title:'1 · Future State', color:'#0a84ff', hint:'Diverge. A year from now, what does agentic support look like at its best? One idea per sticky.'},
      {id:'fz_cluster',     title:'2 · Cluster',      color:'#5856d6', hint:'Drag related stickies together — deflection, trust, tooling, humans-in-the-loop.'},
      {id:'fz_objectives',  title:'3 · Objectives',   color:'#af52de', hint:'For each cluster, drop an Objective card: verb + outcome + measure.'},
      {id:'fz_initiatives', title:'4 · Initiatives',  color:'#ff9500', hint:'Under each objective, add 2–4 Initiative cards. Owner, effort, impact.'},
      {id:'fz_plan',        title:'5 · Plan',         color:'#34c759', hint:'Sequence initiatives across Now / Next / Later. Drag pills to reorder.'},
    ];
    const cards = [
      {id:'ft_title', type:'title', x: 40, y: 40, text:'Frontier Action Plan · Agentic Customer Support', subtitle:'From "AI in the sidebar" to "an agent our customers trust" — Diverge → Cluster → Objectives → Initiatives → Plan'},
    ];
    zones.forEach((z, i) => {
      const x = 40 + i * (zoneW + gap);
      cards.push({id:z.id, type:'group', x, y: top, w: zoneW, h: zoneH, text: z.title, color: z.color});
      cards.push({id:z.id+'_hint', type:'prompt', x: x + 16, y: top + 56, w: zoneW - 32, h: 90, category: z.title.split('·')[1].trim(), text: z.hint});
    });
    cards.push({id:'ft_seed1', type:'sticky', x: 60,  y: top + 180, text:'A year from now, most Tier-1 tickets are resolved by an agent — humans handle exceptions.', color:'#fff59d', groupId:'fz_future'});
    cards.push({id:'ft_seed2', type:'sticky', x: 250, y: top + 180, text:'CSAT holds vs human-only, and every agent action is auditable.',                 color:'#bbdefb', groupId:'fz_future'});
    return {
      canvasType:'whiteboard',
      lanes:[],
      prompts:[
        {id:'fp1', category:'Future',      text:'A year from now, what does agentic customer support look like at its best?', notes:'Bold and specific. No need to reconcile ideas yet — capture everything.'},
        {id:'fp2', category:'Cluster',     text:'What themes are emerging — deflection, trust, tooling, humans-in-the-loop?',    notes:'Aim for 3–6 clusters. Name each with a short verb phrase.'},
        {id:'fp3', category:'Objectives',  text:'For each cluster, what outcome do we commit to and how will we know?',        notes:'Format: verb + outcome + measure (e.g. "Deflect 40% of Tier-1 with CSAT ≥ human baseline").'},
        {id:'fp4', category:'Initiatives', text:'What 2–4 initiatives most credibly deliver each objective?',                   notes:'Capture owner, effort (S/M/L), impact (1–5). Name the guardrail.'},
        {id:'fp5', category:'Plan',        text:'What must we start now to unlock next and later — evals, guardrails, tooling?', notes:'Anything without an owner is a wish, not a plan.'},
      ],
      cards,
      connections:[],
      view:{x:20, y:20, scale:.42},
    };
  },

};
