# SvaraONE Video Workspace — Master Tracker

**Last updated:** 2026-10-15  
**Repository:** `shawnamika-prog/svara-one`  
**Working branch:** `main`  
**Current confirmed Video workspace baseline:** `baefd547141228598a9d166703994d768a12c3ae`

## Purpose and implementation rules

Build the Video workspace around a scene-first production workflow consistent with the approved mockup. The user directs the creative work; SvaraFlow coordinates the workflow. Keep the existing Voice, Sound, Compose, and My Library workspaces stable while implementing Video.

- Work in small, verifiable phases.
- Inspect the current implementation before changing it.
- Preserve existing working behavior and state.
- Do not represent placeholder UI as completed backend functionality.
- Keep provider integration explicit; Runway is the initial video-generation provider.
- Update this tracker as each phase is implemented and tested.

## Workflow

Concept → Storyboard → Assets → Generate → Assemble

## Phase tracker

| Phase | Scope | Status | Acceptance criteria |
|---|---|---|---|
| V1 — Workspace foundation | Scene-first workspace shell; Concept/Storyboard/Assets/Generate/Assemble stages; scene cards; settings tabs; preview; production timeline placeholder; Director/Hybrid/Automatic mode selector | In progress — foundation present | Workspace loads reliably; scene cards and settings are usable; layout works at desktop and mobile widths; no overlap or misleading controls |
| V1.1 — UI cleanup and baseline lock | Fix scene-card layout; remove unwanted “Scene (1)” label/overlay; ensure video/image placeholders never obscure scene title or description; verify navigation/state preservation | Next | Scene text remains readable at all widths; no unwanted scene-number label; navigation does not duplicate or reset the workspace |
| V2 — Scene assets | Connect scene reference images and asset selectors to SvaraONE libraries; define per-scene baseline image, voice, music and sound-effect references | Planned | Asset selection is persisted per scene and clearly indicates missing/ready assets |
| V3 — Runway generation | Validate request payloads, upload/reference handling, task submission and polling; map generated output to the correct scene; robust loading/error/retry behavior | Partially scaffolded; needs verification | Each scene generates independently; task/output association is correct; failures are recoverable and visible |
| V4 — Director approval, versions and credits | Approval/revision workflow; preserve generated versions; show generation state; integrate credit checks and deductions consistently with SvaraONE accounting | Planned | Approved versions are identifiable; revisions do not silently overwrite approved outputs; credit changes are reflected only after successful accounting |
| V5 — Assembly and export | Timeline with scene clips, ordering, trims, transitions, voice/music/sound lanes, sync, preview and final export | Planned | User can assemble approved scene outputs into a coherent timeline and export a final video |
| V6 — Persistence and project library | Save/load projects, scene metadata, prompts, asset references, generated outputs and project history; connect to appropriate library workflows | Planned | Refresh/navigation preserves saved work; project ownership and asset references remain consistent |
| V7 — Quality and release audit | Responsive/UI audit, accessibility, error paths, API/security checks, credit-accounting audit, regression checks across existing workspaces | Planned | Acceptance checklist passes before calling Video production-ready |

## Panel 1 — Creative Discovery update (2026-10-15)

- Replaced the basic Story & Concept form with a Creative Discovery entry experience.
- Two entry paths: **Help me develop my idea** and **I already have a brief**.
- Captures an initial idea, optional website/product URL, optional audience and goal, and selectable reference files.
- Local draft preview suggests the next discovery questions and makes missing details explicit rather than forcing the user to know everything up front.
- The UI clearly states that this draft preview does not upload/analyse selected files or URLs and does not call SvaraFlow/OpenAI yet. No AI generation or persistence is claimed as implemented.
- Verification performed: JavaScript syntax parse passed after the change. Browser/device visual verification remains outstanding.
- Next: connect the discovery submit flow to a real backend orchestration endpoint, define a validated structured concept response, then generate provisional static scene images and assemble a playable concept reel.

## Current foundation notes

- Video workspace entry point: `public/js/video-workspace.js`.
- The current UI contains starter scenes and editable scene metadata/prompt fields.
- Runway submission/polling is scaffolded through `/api/video/runway` and `/api/video/runway/tasks/:id`; this must be verified end-to-end before treating V3 as complete.
- Voice, music and sound-effect selectors are currently placeholders for future asset integration.
- Save Project, Generate All, persistent project storage and the assembly timeline are not complete backend features.
- Do not mark V1 complete until the scene placeholder/text overlap and unwanted “Scene (1)” display are corrected and checked at narrow widths.

## Working protocol

For each phase:
1. Inspect relevant files and the current `main` commit.
2. Agree scope when behavior or architecture is ambiguous.
3. Implement only the agreed scope.
4. Run available checks and inspect the diff.
5. Push/commit to `main` only after validation.
6. Update this tracker with commit SHA, verification performed, remaining risks and next step.

## Immediate next task

Continue **Panel 1 — Creative Discovery integration** after browser review of the new UI. The discovery panel currently creates a local draft only; connect the real SvaraFlow/OpenAI orchestration before representing concept generation as available.

The earlier **V1.1 — UI cleanup and baseline lock** remains a separate verification task:
- Remove the unwanted “Scene (1)” label/overlay.
- Rework scene-card layout so video/image placeholders cannot overlap the scene title or description, including at mobile widths.
- Verify desktop, tablet and mobile layouts, and confirm the latest workspace initialization/state-preservation behavior remains intact.
