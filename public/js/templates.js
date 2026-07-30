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
    const LX = { brain: 80, cluster: 420, prio: 760, next: 1100 };
    const cards = [
      // 1. Brainstorm — raw agentic ideas
      {id:'id_b1', type:'sticky', x:LX.brain, y:120,  text:'Agent drafts refund decisions with policy citations', color:SC.yellow},
      {id:'id_b2', type:'sticky', x:LX.brain, y:280,  text:'Auto-triage inbound tickets by intent + urgency', color:SC.yellow},
      {id:'id_b3', type:'sticky', x:LX.brain, y:440,  text:'Voice agent handles password resets end-to-end', color:SC.yellow},
      {id:'id_b4', type:'sticky', x:LX.brain, y:600,  text:'Copilot suggests next-best reply to the human agent', color:SC.yellow},
      {id:'id_b5', type:'sticky', x:LX.brain, y:760,  text:'Proactive outreach when a customer\'s usage drops', color:SC.yellow},
      {id:'id_b6', type:'sticky', x:LX.brain, y:920,  text:'Agent stitches CRM + billing + logs into one answer', color:SC.yellow},
      {id:'id_b7', type:'sticky', x:LX.brain, y:1080, text:'Self-serve "explain my invoice" agent', color:SC.yellow},
      {id:'id_b8', type:'sticky', x:LX.brain, y:1240, text:'Post-call QA agent scores empathy + accuracy', color:SC.yellow},
      {id:'id_b9', type:'sticky', x:LX.brain, y:1400, text:'Escalation agent writes the handoff brief for L2', color:SC.yellow},
      // 2. Cluster — themed groupings
      {id:'id_c1', type:'sticky', x:LX.cluster, y:120, text:'CLUSTER · Deflection\n• Refund drafts\n• Password resets\n• Invoice explainer', color:SC.blue},
      {id:'id_c2', type:'sticky', x:LX.cluster, y:420, text:'CLUSTER · Agent-assist\n• Next-best reply\n• Unified answer view\n• L2 handoff brief', color:SC.blue},
      {id:'id_c3', type:'sticky', x:LX.cluster, y:720, text:'CLUSTER · Quality + trust\n• Post-call QA\n• Intent triage\n• Proactive outreach', color:SC.blue},
      // 3. Prioritise
      {id:'id_p1', type:'sticky', x:LX.prio, y:120, text:'HIGH impact / LOW effort → Next-best-reply copilot. Human still in the seat.', color:SC.green},
      {id:'id_p2', type:'sticky', x:LX.prio, y:340, text:'HIGH / MED → Invoice explainer. Bounded, rich data, safe to ship.', color:SC.green},
      {id:'id_p3', type:'sticky', x:LX.prio, y:560, text:'MED / HIGH → Refund decisions. Policy risk, needs eval harness.', color:SC.orange},
      {id:'id_p4', type:'sticky', x:LX.prio, y:780, text:'LOW / HIGH → Voice password reset. Auth risk, defer.', color:SC.pink},
      // 4. Next steps
      {id:'id_n1', type:'sticky', x:LX.next, y:120, text:'THIS WEEK · Ship next-best-reply behind a flag for 5 agents. Owner: Maya.', color:SC.purple},
      {id:'id_n2', type:'sticky', x:LX.next, y:340, text:'THIS SPRINT · Prototype invoice explainer with citations. Owner: Rahul.', color:SC.purple},
      {id:'id_n3', type:'sticky', x:LX.next, y:560, text:'THIS QUARTER · Stand up evals + policy corpus for refund agent. Owner: Priya.', color:SC.purple},
      {id:'id_n4', type:'sticky', x:LX.next, y:780, text:'DECISION · Park voice reset until IVR auth story lands.', color:SC.pink},
    ];
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
      view: {x:20,y:20,scale:.55},
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
      // Says
      {id:'em_s1', type:'sticky', x:260,  y:140, text:'"I still re-read every line it writes."', color:SC.blue},
      {id:'em_s2', type:'sticky', x:260,  y:290, text:'"It saved me an hour — then I spent an hour double-checking it."', color:SC.blue},
      {id:'em_s3', type:'sticky', x:260,  y:440, text:'"I don\'t use it in the payments repo. Full stop."', color:SC.blue},
      // Thinks
      {id:'em_t1', type:'sticky', x:900,  y:140, text:'"Am I becoming a reviewer instead of an engineer?"', color:SC.purple},
      {id:'em_t2', type:'sticky', x:900,  y:290, text:'"If this leaks our code, my name is on the PR."', color:SC.purple},
      {id:'em_t3', type:'sticky', x:900,  y:440, text:'"Do I still understand this codebase, or just the agent\'s version of it?"', color:SC.purple},
      // Does
      {id:'em_d1', type:'sticky', x:260,  y:600, text:'Turns the agent off in sensitive repos', color:SC.green},
      {id:'em_d2', type:'sticky', x:260,  y:750, text:'Accepts small completions, rejects big refactors', color:SC.green},
      {id:'em_d3', type:'sticky', x:260,  y:900, text:'Copies suggestions into a scratch file to sanity-check', color:SC.green},
      // Feels
      {id:'em_f1', type:'sticky', x:900,  y:600, text:'Anxious before shipping AI-written code', color:SC.pink},
      {id:'em_f2', type:'sticky', x:900,  y:750, text:'Quietly proud when a copilot-drafted PR lands clean', color:SC.green},
      {id:'em_f3', type:'sticky', x:900,  y:900, text:'Frustrated when it invents an API that doesn\'t exist', color:SC.pink},
      // Pains
      {id:'em_p1', type:'sticky', x:260,  y:1060, text:'Fear of subtle bugs slipping past review', color:SC.pink},
      {id:'em_p2', type:'sticky', x:260,  y:1210, text:'Unclear IP + licensing story with generated code', color:SC.pink},
      {id:'em_p3', type:'sticky', x:260,  y:1360, text:'No way to see which tools/data the agent used', color:SC.orange},
      // Gains
      {id:'em_g1', type:'sticky', x:900,  y:1060, text:'Wants to ship 2× without losing craft', color:SC.yellow},
      {id:'em_g2', type:'sticky', x:900,  y:1210, text:'Wants boilerplate + tests written for them', color:SC.yellow},
      {id:'em_g3', type:'sticky', x:900,  y:1360, text:'Wants a trusted teammate for the boring 80%', color:SC.yellow},
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
      // Went well
      {id:'r_w1', type:'sticky', x:120, y:120,  text:'Human-in-the-loop kept trust high — zero customer-visible bad outputs.', color:SC.green},
      {id:'r_w2', type:'sticky', x:120, y:300,  text:'Prompt + tool changes reviewed like code (PRs, owners, tests).', color:SC.green},
      {id:'r_w3', type:'sticky', x:120, y:480,  text:'Deflection lifted 22% on Tier-1 refund questions.', color:SC.green},
      {id:'r_w4', type:'sticky', x:120, y:660,  text:'Weekly "agent office hours" surfaced real user quotes fast.', color:SC.green},
      // Didn\'t go well
      {id:'r_b1', type:'sticky', x:120, y:900,  text:'Eval harness was an afterthought — regressions caught by users, not us.', color:SC.pink},
      {id:'r_b2', type:'sticky', x:120, y:1080, text:'No shared view of tool-call cost — spend surprised finance.', color:SC.pink},
      {id:'r_b3', type:'sticky', x:120, y:1260, text:'Escalation path to L2 was ambiguous; agents dropped context.', color:SC.pink},
      {id:'r_b4', type:'sticky', x:120, y:1440, text:'Prompt sprawl — 6 near-duplicate refund prompts across teams.', color:SC.pink},
      // Ideas
      {id:'r_i1', type:'sticky', x:120, y:1680, text:'Tool-call tracing dashboard shared with support + eng.', color:SC.yellow},
      {id:'r_i2', type:'sticky', x:120, y:1860, text:'"Golden set" of 200 real tickets, run nightly against every prompt change.', color:SC.yellow},
      {id:'r_i3', type:'sticky', x:120, y:2040, text:'Prompt registry — one canonical prompt per intent, owned by a person.', color:SC.yellow},
      {id:'r_i4', type:'sticky', x:120, y:2220, text:'Per-agent cost budget with a soft kill-switch.', color:SC.yellow},
      // Actions
      {id:'r_a1', type:'sticky', x:120, y:2460, text:'ACTION · Stand up evals-first workflow before next pilot. Owner: Priya. Due: Aug 15.', color:SC.blue},
      {id:'r_a2', type:'sticky', x:120, y:2640, text:'ACTION · Ship tool-call tracing v1. Owner: Sam. Due: end of month.', color:SC.blue},
      {id:'r_a3', type:'sticky', x:120, y:2820, text:'ACTION · Publish escalation runbook + rehearse with L2. Owner: Maya. Due: next Friday.', color:SC.blue},
      {id:'r_a4', type:'sticky', x:120, y:3000, text:'DECISION · Freeze new prompts until registry lands.', color:SC.blue},
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
    // Zone x positions: 40 + i*(440+40)
    const zx = i => 40 + i * (zoneW + gap);
    const inner = i => zx(i) + 20;
    const yTop = top + 170;
    const stick = (id, i, row, text, color, extra={}) => cards.push({
      id, type:'sticky',
      x: inner(i) + (row % 2) * 200,
      y: yTop + Math.floor(row / 2) * 130,
      w: 180, h: 110,
      text, color, groupId: zones[i].id, ...extra,
    });
    // 1 · Future State — diverged ideas
    stick('ft_f1', 0, 0, 'Tier-1 tickets resolved by an agent in <60s, humans handle exceptions.', SC.yellow);
    stick('ft_f2', 0, 1, 'Every agent action carries a full audit trail customers can request.', SC.blue);
    stick('ft_f3', 0, 2, 'Customers say "it felt like talking to your best rep."', SC.green);
    stick('ft_f4', 0, 3, 'One "explain-my-invoice" agent kills our #1 ticket driver.', SC.pink);
    stick('ft_f5', 0, 4, 'Support cost per contact ↓ 40% without CSAT drop.', SC.orange);
    stick('ft_f6', 0, 5, 'Humans do coaching + edge cases, not password resets.', SC.purple);
    // 2 · Cluster — theme cards
    stick('ft_c1', 1, 0, 'CLUSTER · Deflection\nInvoice explainer, refund drafts, password resets.', SC.blue);
    stick('ft_c2', 1, 1, 'CLUSTER · Trust + audit\nCitations, audit trails, kill switches.', SC.blue);
    stick('ft_c3', 1, 2, 'CLUSTER · Agent-assist\nNext-best-reply, unified answer view, L2 handoff brief.', SC.blue);
    stick('ft_c4', 1, 3, 'CLUSTER · Ops + evals\nGolden sets, cost budgets, prompt registry.', SC.blue);
    // 3 · Objectives
    stick('ft_o1', 2, 0, 'OBJECTIVE\nDeflect 40% of Tier-1 by Q2, CSAT ≥ human baseline.', SC.purple);
    stick('ft_o2', 2, 1, 'OBJECTIVE\nEvery agent action auditable + explainable to customers.', SC.purple);
    stick('ft_o3', 2, 2, 'OBJECTIVE\nCut avg handle time 30% for human-assisted contacts.', SC.purple);
    stick('ft_o4', 2, 3, 'OBJECTIVE\nZero policy violations attributable to the agent.', SC.purple);
    // 4 · Initiatives
    stick('ft_i1', 3, 0, 'INITIATIVE · Invoice explainer\nOwner: Rahul · Effort M · Impact 5', SC.orange);
    stick('ft_i2', 3, 1, 'INITIATIVE · Refund draft agent\nOwner: Priya · Effort L · Impact 4', SC.orange);
    stick('ft_i3', 3, 2, 'INITIATIVE · Next-best-reply copilot\nOwner: Maya · Effort S · Impact 5', SC.orange);
    stick('ft_i4', 3, 3, 'INITIATIVE · Eval + prompt registry\nOwner: Sam · Effort M · Impact 4', SC.orange);
    stick('ft_i5', 3, 4, 'INITIATIVE · Audit trail + citations UI\nOwner: Lin · Effort M · Impact 3', SC.orange);
    stick('ft_i6', 3, 5, 'INITIATIVE · Cost + kill-switch guardrails\nOwner: Sam · Effort S · Impact 3', SC.orange);
    // 5 · Plan (Now / Next / Later)
    stick('ft_p1', 4, 0, 'NOW · Next-best-reply copilot behind flag for 5 agents.', SC.green);
    stick('ft_p2', 4, 1, 'NOW · Eval + prompt registry v1, "golden set" of 200 tickets.', SC.green);
    stick('ft_p3', 4, 2, 'NEXT · Invoice explainer GA to 100% of self-serve.', SC.yellow);
    stick('ft_p4', 4, 3, 'NEXT · Audit trail + citations UI shipped.', SC.yellow);
    stick('ft_p5', 4, 4, 'LATER · Refund draft agent pilot (policy sign-off first).', SC.pink);
    stick('ft_p6', 4, 5, 'LATER · Cost + kill-switch guardrails GA across all agents.', SC.pink);
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

  // Real-world scenario: value canvas for an agentic claims-triage use case
  valuecanvas: () => {
    const CX = 1200, CY = 780;
    const hub = { id:'vc_hub', type:'valuehub', x:CX-160, y:CY-85, w:320, h:170,
      text:'Agentic claims triage',
      summary:'An AI agent reads each new motor claim, checks policy + fraud signals, and either settles it straight through or routes it to the right handler with a recommendation.' };
    const S = [
      { id:'vc_s1', x:CX-130,      y:CY-560, name:'Claims handlers', role:'Operations · 240 FTE',
        why:'Stops the copy-paste triage grind so handlers spend their day on complex, judgement-heavy claims.',
        measure:'Avg. handling time per claim (target −35%); % of shift on complex work',
        when:'Weeks 6–10 — as soon as the pilot queue is live' },
      { id:'vc_s2', x:CX+520,      y:CY-330, name:'Policyholders', role:'End customers',
        why:'Simple claims are settled the same day instead of waiting on a queue, with a clear reason given.',
        measure:'Time-to-first-decision; claims NPS; % settled straight-through',
        when:'Month 3 — first full cohort through the agent' },
      { id:'vc_s3', x:CX+520,      y:CY+180, name:'Claims Operations Director', role:'Sponsor · P&L owner',
        why:'Absorbs the seasonal claims spike without adding headcount, and makes cost per claim predictable.',
        measure:'Cost per claim; backlog age; overtime spend',
        when:'Month 6 — after peak season comparison' },
      { id:'vc_s4', x:CX-130,      y:CY+300, name:'Fraud & Risk', role:'Second line of defence',
        why:'Every claim gets a consistent fraud screen rather than sampling, and referrals arrive pre-evidenced.',
        measure:'Fraud detection rate; false-positive referral rate',
        when:'Month 4 — once the fraud model feedback loop closes' },
      { id:'vc_s5', x:CX-780,      y:CY+180, name:'Compliance & Legal', role:'Governance',
        why:'Decisions are explainable and auditable, with a human sign-off on anything above threshold.',
        measure:'% decisions with complete audit trail; regulator findings (target zero)',
        when:'Month 2 — at the governance gate before go-live' },
      { id:'vc_s6', x:CX-780,      y:CY-330, name:'Technology & Data', role:'Platform team',
        why:'One reusable agent pattern — retrieval, tools, evals — that other lines of business can adopt.',
        measure:'Reuse count across LOBs; eval pass rate; run cost per 1k claims',
        when:'Month 9 — after the second line of business onboards' },
    ];
    // Second-degree stakeholders — they inherit value via a primary stakeholder
    const S2 = [
      { id:'vc_t1', via:'vc_s1', x:CX-560, y:CY-800, name:'Team leaders', role:'Workforce planning',
        why:'Shift planning gets predictable once triage volume is absorbed by the agent, so rotas stop being firefighting.',
        measure:'Forecast accuracy on daily volume; unplanned overtime hours',
        when:'Month 4 — one full planning cycle after pilot' },
      { id:'vc_t2', via:'vc_s2', x:CX+880, y:CY-470, name:'Brokers & aggregators', role:'Distribution partners',
        why:'Faster settlements make the product easier to sell and cut chase-up calls from their own customers.',
        measure:'Broker complaint volume; partner retention at renewal',
        when:'Month 5 — after the first cohort of settled claims' },
      { id:'vc_t3', via:'vc_s4', x:CX+200, y:CY+570, name:'Underwriting', role:'Pricing & portfolio',
        why:'Consistent fraud screening produces cleaner loss data, which sharpens pricing on renewal.',
        measure:'Loss-ratio variance; % claims with structured cause coding',
        when:'Month 8 — once a full data cut feeds pricing' },
      { id:'vc_t4', via:'vc_s5', x:CX-1100, y:CY+430, name:'External auditor / FCA', role:'Regulator & assurance',
        why:'Every automated decision carries a reproducible trail, so assurance work becomes sampling rather than reconstruction.',
        measure:'Audit hours per review; open findings carried forward',
        when:'Month 7 — at the first post-go-live review' },
      { id:'vc_t5', via:'vc_s6', x:CX-1100, y:CY-520, name:'Other LOB product teams', role:'Home, travel, pet',
        why:'They reuse the triage agent pattern instead of funding their own build from scratch.',
        measure:'Build cost avoided per LOB; time from kickoff to pilot',
        when:'Month 10 — second line of business onboards' },
    ];
    const cards = [
      { id:'vc_title', type:'title', x:CX-360, y:60, w:720, h:120,
        text:'Value Canvas — Agentic Claims Triage',
        subtitle:'Who gains, why it matters to them, how we measure it, and when the value lands' },
      hub,
      ...S.map(s => ({ id:s.id, type:'stakeholder', x:s.x, y:s.y, w:260, h:210,
        text:s.name, role:s.role, valueWhy:s.why, valueMeasure:s.measure, valueWhen:s.when })),
      ...S2.map(s => ({ id:s.id, type:'stakeholder2', x:s.x, y:s.y, w:240, h:200, linkedTo:s.via,
        text:s.name, role:s.role, valueWhy:s.why, valueMeasure:s.measure, valueWhen:s.when })),
    ];
    const anchorsBetween = (ax, ay, bx, by) => {
      const dx = bx - ax, dy = by - ay;
      const horiz = Math.abs(dx) > Math.abs(dy);
      return horiz
        ? { fromAnchor: dx > 0 ? 'right' : 'left', toAnchor: dx > 0 ? 'left' : 'right' }
        : { fromAnchor: dy > 0 ? 'bottom' : 'top', toAnchor: dy > 0 ? 'top' : 'bottom' };
    };
    const anchorsFor = (s) => anchorsBetween(CX, CY, s.x + 130, s.y + 105);
    const connections = [
      ...S.map((s, i) => ({ id:'vcc'+(i+1), from:'vc_hub', to:s.id, ...anchorsFor(s) })),
      ...S2.map((s, i) => {
        const p = S.find(x => x.id === s.via);
        return { id:'vct'+(i+1), from:s.via, to:s.id, dashed:true,
          ...anchorsBetween(p.x + 130, p.y + 105, s.x + 120, s.y + 100) };
      }),
    ];

    return {
      canvasType:'valuecanvas',
      lanes:[],
      prompts:[
        {id:'vcp1', category:'Use case', text:'In one sentence, what does this use case actually do — and for whom?', notes:'Put the agent\'s job in plain language. If it takes two sentences, the scope is too wide.'},
        {id:'vcp2', category:'Stakeholders', text:'Who is materially affected by this use case — including the people who have to govern or support it?', notes:'Push past the obvious two. Sponsors, second line, platform teams and end customers all hold value.'},
        {id:'vcp3', category:'Why valuable', text:'For each stakeholder, why would they personally care? What gets better in their week?', notes:'Value stated in their language, not ours. "Fewer tickets" beats "improved efficiency".'},
        {id:'vcp4', category:'Measure', text:'How will we know the value landed — what number moves, and from what baseline?', notes:'One or two measures per stakeholder. If nobody owns the baseline, the measure is fiction.'},
        {id:'vcp5', category:'Timing', text:'When does each stakeholder realistically realise the value — weeks, months, or after scale?', notes:'Separate pilot-stage value from at-scale value. Sequencing sets expectations.'},
      ],
      cards,
      connections,
      view:{x:60, y:40, scale:.52},
    };
  },

};

