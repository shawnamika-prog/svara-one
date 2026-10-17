## D1-backed Video project persistence (2026-10-17)

- Added migration `0017_video_projects.sql` for per-user Video projects, current workflow stage, approved stage list, and a versioned JSON project snapshot.
- Added authenticated `GET /api/video/projects/current` and `PUT /api/video/projects/current` routes. Projects are scoped to the signed-in user; payload size and stage values are validated.
- Creative Discovery now autosaves text/control changes and generated/refined concepts; approval persists the concept, editable storyboard scene data, stage approvals and next stage before advancing.
- Progressive stage approval saves to D1 before unlocking the next panel. Save failures leave the user in the current stage and report an error instead of marking the stage approved.
- Added a short inspirational quote under each downstream stage heading. Branding can still be skipped, and no media generation is triggered by saving/approval.
- On workspace initialization, the latest saved project is loaded and its concept, scene list, editable form values and workflow progress are restored.
- Important persistence boundary: browser-selected files and blob-preview URLs are not durable uploads. File names are retained as UI metadata, but logo/reference files and generated media must be uploaded to R2 or another persistent asset store in a later step.
- Verification: frontend JavaScript syntax and Worker entrypoint syntax checks passed. No live D1 migration, deployed API, or browser refresh/recovery test has been executed in this environment. Apply migration `0017_video_projects.sql` to the configured `svaraone-db` D1 database before expecting the new API to save/load successfully.
- Frontend cache version: `20261017-18`.
- Follow-up hardening: approval waits for any in-flight autosave, scene additions/edits/deletions schedule saves, starting a new idea clears prior approvals, and refining an approved concept requires approval again.

## Remove redundant Section A divider (2026-10-17)

- Removed the top border and extra top margin from Section A only, preventing it from clashing with the main Creative Discovery panel divider.
- Sections B and C retain their separators.
- Cache version updated to `20261017-16`. Frontend JavaScript syntax passed; live browser verification remains outstanding.

## Panel-level Collapse / Expand labels (2026-10-17)

- Replaced the panel-level standalone arrow visually with a subtle text control: “Collapse ↑” while expanded and “Expand ↓” while collapsed.
- Section-level A/B/C controls remain bordered indigo chevron buttons and are unaffected.
- Cache version updated to `20261017-15`. Frontend JavaScript syntax passed; live browser verification remains outstanding.

## Accordion chevron alignment and contrast (2026-10-17)

- Changed the collapse control to inline-flex with explicit center alignment, zero padding/margin and centered text.
- Brightened the default indigo fill and border so the control is more visible at rest; hover/focus states remain brighter.
- Cache version updated to `20261017-13`. JavaScript syntax passed; visual browser verification remains outstanding.

## Panel 1 accordion control styling (2026-10-17)

- Styled A/B/C collapse chevrons as consistent 30×30 px bordered controls with a dark SvaraONE background, rounded corners, and subtle indigo hover/focus states.
- Matched Section C's right offset to the same inset as the standard section summaries.
- Cache version updated to `20261017-12`. Frontend JavaScript syntax passed; browser visual verification remains outstanding.

## Discovery section navigation behavior (2026-10-17)

- “Edit my answers” opens Section A and explicitly closes Sections B and C while keeping their concept/refinement content intact for return.
- “Generate a new idea” still asks for confirmation. On confirmation, it clears the creative concept and refinements, hides Sections B and C, opens Section A, and scrolls to Section A's heading automatically.
- Cache version updated to `20261017-08`; frontend JavaScript syntax passed. Live browser test remains outstanding.

## Separate Edit my answers and Generate a new idea (2026-10-17)

- “Edit my answers” now simply reopens Section A while preserving the current concept and refinement history, so users can adjust inputs without losing their work.
- Added “Generate a new idea” as a separate action that opens the confirmation dialog. Confirming clears the concept and refinement history, hides/clears Section B and removes Section C while retaining discovery answers.
- The confirmation action is labelled “Generate new idea”. Cache version updated to `20261017-05`.
- Frontend JavaScript syntax passed; live browser interaction test remains outstanding.

## Confirm before restarting Creative Discovery (2026-10-17)

- “Edit my answers” now opens a confirmation dialog explaining that the current creative direction, refinements and approval will be cleared while the discovery answers are retained for editing.
- Cancel closes the dialog without changing the concept. Confirm clears the current concept/history, hides and clears Section B, removes Section C, hides the approval actions, and reopens Section A.
- Frontend JavaScript syntax passed. Cache version updated to `20261017-04`. Live browser interaction test remains outstanding.

## Refinement panel and Edit my answers behavior (2026-10-17)

- Removed the static “Text-only refinement · no media credits used” line; the live status region remains available for progress feedback during refinement.
- “Edit my answers” now reopens Section A, collapses Section B, hides the current concept/actions and hides/collapses Section C until a fresh concept is generated. Existing form answers remain in place for editing.
- Frontend JavaScript syntax passed. Cache version updated to `20261017-03`. Live browser interaction test remains outstanding.

## Remove duplicate refinement heading (2026-10-17)

- Removed the redundant inner “Refine with SvaraFlow” title, subtitle and icon from the refinement form.
- The centered Section C heading remains the single heading; refinement controls follow directly beneath it.
- Frontend JavaScript syntax passed. Cache version updated to `20261017-02`. Live browser verification remains outstanding.

## Section C duplicate and alignment fix (2026-10-17)

- Centered the Section C heading while keeping the C marker and chevron anchored at the left and right edges.
- Fixed duplicate Section C creation: before rebuilding the concept during refinement or undo, remove the previous C element from its stable host. The newly rendered C is then moved into that host, so repeated interactions leave exactly one section.
- Frontend JavaScript syntax passed. Cache version updated to `20261017-01`. Browser interaction test remains outstanding.

## Section C rendering-order fix (2026-10-17)

- Root cause: the renderer queried for Section C before assigning the generated concept HTML, so the element did not exist yet and relocation never ran.
- Moved Section C lookup/relocation until after the concept markup is rendered; C is then moved to the stable sibling host, unhidden and left collapsed.
- Frontend JavaScript syntax check passed. Cache version updated to `20261016-23`. Live browser verification is still required.

## Header and refinement visibility fix (2026-10-16)

- Removed the workflow status sentence beneath the seven-step timeline from the Video header.
- Fixed Section C visibility after discovery: the refinement section is moved to its stable sibling host, made visible after successful concept generation, and remains independently collapsed until opened by the user.
- Cache version updated to `20261016-22`. Frontend syntax check passed; live browser test not run.


## Creative Discovery section hierarchy correction (2026-10-16)

- Renamed the three inner section markers from numeric labels to A, B and C.
- Section A (Discover your idea) remains visible and open by default. Section B (Creative concept) is hidden until a successful concept is generated, then opens while A collapses.
- Section C (Refine with SvaraFlow) is relocated out of the concept canvas into its own sibling section within Panel 1. It becomes visible after successful concept generation and is independently collapsible.
- Existing discovery/refinement requests, undo behaviour, approval controls and media credit protections are unchanged. Cache version updated to `20261016-21`. Frontend syntax check passed; live browser test not run.


## Creative Discovery collapsible sections (2026-10-16)

- Restructured Panel 1 into three collapsible sections inside the existing panel: Discover Your Idea, Creative Concept, and Refine with SvaraFlow.
- Removed the nested-card feel by using flat section headers, numbered markers, subtle separators and shared panel background.
- Discovery opens by default. When a concept is generated, the input section collapses and the concept section opens to give the visual canvas more room. Users can expand/collapse each section independently; “Edit my answers” returns focus to discovery.
- No changes to discovery/refinement API contracts, approval behavior or media credit handling. Cache version updated to `20261016-20`. Frontend syntax check passed; live browser interaction tests not run.


## Video header timeline polish (2026-10-16)

- Moved the seven-step workflow timeline inside the existing Video header card so the header and timeline read as one cohesive panel.
- Corrected connector positioning so timeline lines run only between the circular step markers, with opaque marker backgrounds to prevent line bleed behind disabled/current buttons.
- Frontend syntax check passed; cache version updated to `20261016-19`. Live browser verification not performed.


## Guided Video Workflow Timeline (2026-10-16)

- Added a seven-stage timeline below the existing Video header: Story & Concept, Branding, Characters, Environments, Visual Style, Storyboard & Concept Reel, and Generate & Assemble.
- Future stage panels remain hidden until the preceding stage is approved. Timeline steps let users revisit available stages; current and approved states are reflected in the timeline.
- Added explicit stage approval/continue controls. Branding can be skipped for non-branded projects.
- Workflow stage and approval state are session-scoped for now. They reset on refresh until concept, scene and asset persistence are connected; this avoids restoring a later stage without its unsaved creative data.
- Concept approval creates editable scene data but keeps the storyboard panel gated until Branding, Characters, Environments and Visual Style are approved or branding is skipped. No media is generated during workflow progression.
- Refining an already-approved concept clears downstream approvals and returns the user to the concept stage for review.
- Cache version updated to `20261016-18`. Frontend syntax check passed. Live browser interaction tests were not run.


## Creative Discovery initialization fix (2026-10-16)

- Fixed a stale `actions` reference left behind when the concept renderer was extracted for reuse during refinements. It could throw a temporal-dead-zone error before the concept was displayed.
- Renderer now resolves its own result-action element; frontend syntax check passed. Cache version updated to `20261016-17`. Live browser/API verification remains pending.

## Creative Discovery iterative refinement (2026-10-16)

- Added an authenticated `POST /api/video/refine` endpoint using the existing strict structured concept schema and configured OpenAI model.
- Added an in-canvas “Refine with SvaraFlow” panel for overall concept, one selected scene, visual style/camera, or narration/messaging refinement.
- Each request includes the current structured concept and explicit scope-preservation instructions. The model returns a revised concept without approving it or launching media generation.
- The frontend keeps up to 10 previous concept snapshots in the current workspace session and supports undoing the latest refinement. Durable project persistence is not part of this phase.
- Text-only refinement does not call image/video providers or deduct media-generation credits. Explicit approval remains separate.
- Cache version updated to `20261016-16`. JavaScript syntax checks passed; live API/browser tests were not run.


## Creative Canvas header layout correction (2026-10-16)

- Changed the concept header from a side-by-side title/metadata layout to a full-width vertical hierarchy.
- Title and logline now occupy the full available width; duration, format and audience chips sit in a separate row below them and wrap only as needed.
- Existing visual style/tone strip and storyboard canvas are unchanged.
- Cache version updated to `20261016-15`. JavaScript syntax check passed; live browser visual verification remains pending.

## Creative Canvas detail refinement (2026-10-16)

- Removed the repeated visual-description row from the selected-scene detail panel because the large visual preview already displays that description.
- Replaced the still-camera icon with a camcorder/video-camera SVG.
- Combined camera direction and narration into one shared, visually grouped panel with clear labels and a divider.
- Empty narration is represented compactly as “No narration for this scene” rather than an oversized empty card.
- Cache-busted video workspace assets to `20261016-14`. JavaScript syntax validation passed; browser rendering not independently verified.

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
- Keep provider integration configurable; Runway is the current test adapter, not a permanent architectural dependency.
- Use Cloudflare bindings `VIDEO_API_KEY` (secret), `VIDEO_API_URL`, `VIDEO_PROVIDER`, and `VIDEO_MODEL`; do not put secret values in `wrangler.jsonc`.
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

## Video provider configuration baseline (2026-10-15)

- Standardised provider bindings to `VIDEO_API_KEY` (Cloudflare secret), `VIDEO_API_URL`, `VIDEO_PROVIDER`, and `VIDEO_MODEL`.
- Wrangler defaults: `VIDEO_PROVIDER=runway`, `VIDEO_API_URL=https://api.dev.runwayml.com`, `VIDEO_MODEL=gen4_turbo`.
- The temporary Runway adapter now reads the configured base URL, model and `VIDEO_API_KEY`; it rejects a provider mismatch rather than pretending another provider is supported.
- API key must be created as a Cloudflare secret named `VIDEO_API_KEY`; it is intentionally not written into `wrangler.jsonc`.

## Panel 1 — Creative Discovery update (2026-10-15)

- Replaced the basic Story & Concept form with a Creative Discovery entry experience.
- Two entry paths: **Help me develop my idea** and **I already have a brief**.
- Captures an initial idea, optional website/product URL, optional audience and goal, and selectable reference files.
- Local draft preview suggests the next discovery questions and makes missing details explicit rather than forcing the user to know everything up front.
- The UI clearly states that this draft preview does not upload/analyse selected files or URLs and does not call SvaraFlow/OpenAI yet. No AI generation or persistence is claimed as implemented.
- Verification performed: JavaScript syntax parse passed after the change. Browser/device visual verification remains outstanding.
- Next: connect the discovery submit flow to a real backend orchestration endpoint, define a validated structured concept response, then generate provisional static scene images and assemble a playable concept reel.

## Panel 1 — Creative Discovery functionality (2026-10-15)

- Added authenticated `POST /api/video/discovery` using the existing `OPENAI_API_KEY` Cloudflare secret and the configured SvaraFlow model fallback.
- Reworked SvaraFlow instructions to act as a human-facing creative director, prioritise a specific story and emotional arc, avoid AI-to-AI prompt language and generic marketing filler, and keep the concept and scene fields concise.
- Expanded schema field descriptions with concise guidance for the logline, creative direction, visual direction, camera direction and actual spoken narration. Every scene still returns consistent visual, camera and narration fields; narration may be empty when it is not needed.
- Redesigned the concept response to be left-aligned, more compact, and easier to scan. Uses icons rather than repeated field labels for format, duration, audience, objective, visual, camera and narration. Questions and assumptions are tucked into a collapsed disclosure.
- Approval remains explicit: approving creates editable storyboard scene cards; it does not generate images or video.
- Limitations remain: reference files are not uploaded/analysed, URLs are not fetched, and no still images or concept reel are generated yet.
- Verification: frontend JavaScript syntax passed; Worker entrypoint syntax passed after removing ES-module import/export declarations for the check. No live OpenAI request or deployed browser test has been run.
- Commits: backend prompt/schema `f0eee99f1781e76af8dc53bd05398aba5fb7e7f2`; concept UI `525b380dca431be8c5b456672677b04f623c70f2`; typography `8ebe6ce092520081cd8f63e7c3ab8459be9d2499`; cache bust `05d3757b14c7273af26eeb252f0fbfaec95c227f`.

## Creative Discovery — Option C Creative Canvas (2026-10-16)

- Replaced the text-heavy concept response with a focused creative canvas: title and concise logline, compact metadata chips, a visual-style/tone strip, one large selected-scene preview, a five-scene thumbnail rail, and a compact selected-scene details panel.
- Selecting a scene updates its title, duration, visual description, camera direction and narration in place. The user can scan the story without seeing every scene's full text at once.
- Reduced repeated metadata and moved questions/assumptions into a collapsed disclosure. The takeaway and call to action are kept in a single compact footer.
- Scene thumbnails and the large preview are clearly marked as illustrative UI; no generated image/video or reference-file analysis is claimed. Real scene-image generation remains a future implementation.
- Responsive layout stacks the preview, scene rail and details on narrower screens.
- Verification: JavaScript syntax parse and responsive CSS review performed; no live OpenAI request or deployed browser/device visual test performed.

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


## My Video Projects — saved draft management (2026-10-17)

- Added a dedicated **My Video Projects** panel above Creative Discovery with saved project title, status, workflow stage and last-updated time.
- Added authenticated API operations to list projects, open a project by ID, and delete a project by ID. All reads/deletes are scoped to the authenticated user; the existing D1 `video_projects` table is reused.
- Open restores the selected project's concept, discovery answers, workflow approvals and storyboard. Delete requires confirmation and removes only the selected project.
- Deleting the currently open project resets the workspace for a new idea and refreshes the project list.
- Verification performed: frontend JavaScript syntax parse passed. Live deployed-browser and API tests remain pending.
