# Frontier Action Plan — multi-stage workflow

Turn the Future-State Backcast into a real facilitated arc: **Diverge → Group → Objectives → Initiatives → Plan**. Each stage is its own canvas tab, but they share state so ideas flow forward instead of dying on one board.

## Stage model

Introduce a `stageKind` on each canvas tab (in addition to `canvasType`). The Frontier template seeds five linked tabs:

1. **1 · Future State** — backcast canvas (existing). Participants throw sticky notes at the prompt.
2. **2 · Cluster** — new canvas kind `cluster`. Sticky notes from stage 1 are auto-pulled in; facilitator drops **Group** frames and drags stickies into them.
3. **3 · Objectives** — new canvas kind `objectives`. Each group from stage 2 becomes a candidate **Objective card** with title, outcome statement, success measure, and a "promote" toggle.
4. **4 · Initiatives** — new canvas kind `initiatives`. Promoted objectives appear as column headers; team adds **Initiative cards** (name, hypothesis, owner, effort, impact) under each.
5. **5 · Plan** — new canvas kind `plan`. Strategy-on-a-page-style horizon lanes (Now / Next / Later) with the initiatives placed as pills; export-ready.

Stages are ordered and shown as a numbered progress rail above the tab bar with links (← Back to Cluster / Continue to Objectives →).

## New canvas primitives

- **Group frame** — resizable rectangle card with a title, colour, and count badge. Sticky notes whose centre falls inside a group frame are "members" of that group. Group membership is derived on drop (hit-test) and stored as `card.groupId`. Frames render below cards, above lane bands.
- **Objective card** — larger card type with fields: *Objective title*, *Why it matters*, *Measure of success*, source group reference, and a "Promote to plan" checkbox.
- **Initiative card** — compact card with fields: *Name*, *Hypothesis*, *Owner*, *Effort (S/M/L)*, *Impact (1–5)*, `objectiveId` link.

## Flow between stages

Add a small **"Send forward"** action per stage:

- Stage 1 → 2: "Cluster these ideas" copies all sticky notes to the Cluster canvas (by reference — same `id`, positions reset into a soft grid).
- Stage 2 → 3: "Draft objectives" creates one Objective card per Group frame on the Objectives canvas, pre-filling title from the group name and linking `sourceGroupId`.
- Stage 3 → 4: "Promote to plan" — every objective with the toggle on becomes a column on Initiatives.
- Stage 4 → 5: "Build plan" — each initiative becomes a pill on the Plan canvas under its objective, placed in the *Now* lane by default; drag between Now/Next/Later.

Cross-stage links are stored in a shared `state.workflow` object on the tab set so re-running a step updates instead of duplicating.

## Template seeding

`Frontier action plan` template (extends Future-State Backcast) creates the five tabs pre-wired, seeds stage 1 with the existing backcast lanes/prompts, and drops the progress rail explainer card on each subsequent stage.

## UI additions

- Progress rail component above the tab bar, only visible when a workflow is active. Click a step to jump.
- Palette gets a new **Workflow** section (visible on cluster/objectives/initiatives/plan canvases) with: Group frame, Objective, Initiative, Horizon lane.
- Right-click menu gains "Wrap selection in group" on the Cluster canvas.

## Technical details

Files touched:

- `public/discovery.html` — the vast majority: new canvas kinds, card types, group hit-testing on drag end, stage transition functions (`promoteGroupsToObjectives`, etc.), progress rail, template seed data, palette entries, export handlers per stage.
- `src/routes/index.tsx` — bump cache-buster to `?v=frontier1`.

Data shape additions:

```text
tab: { id, name, canvasType, stageKind?, workflowId? }
state.workflow: {
  id, stages: [{tabId, kind}],
  groups: [{id, name, color, memberCardIds[]}],
  objectives: [{id, title, why, measure, sourceGroupId, promoted}],
  initiatives: [{id, name, hypothesis, owner, effort, impact, objectiveId, horizon}]
}
card types added: 'group', 'objective', 'initiative'
canvas types added: 'cluster', 'objectives', 'initiatives', 'plan'
```

Group membership is computed on `pointerup` after a card drag: iterate group frames, check whether the card's centre point is inside; assign `card.groupId` accordingly. Group count badge updates reactively.

Export: Smart export on stage 5 renders a one-page PDF titled with the session name and lists Objectives → Initiatives → Horizons.

## Out of scope for this pass

- Voting / dot-prioritisation on stickies (can layer on later).
- Real-time multi-user cursors.
- Editing initiative cards from the Plan canvas (edits happen on stage 4).
