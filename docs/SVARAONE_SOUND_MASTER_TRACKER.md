| # | Phase | Area | Status | Done? | Required work | Success condition |
|---|---|---|---|---|---|---|
| **S0** | Architecture | Overall Sound architecture | 🟢 | **Yes** | Define Sound as independent domain, SvaraFlow/providers/D1/R2/credits/compositions | Architecture approved and locked |
| **S1** | Sound provider abstraction | Provider layer | 🟢 | **Yes** | Provider interface/base contract | Provider abstraction passes testing |
| **S2** | Sound generation service | Backend lifecycle | 🟢 | **Yes** | Generation lifecycle, persistence, statuses, inputs, parameters | Lifecycle works independently of provider |
| **S3** | Sound API | `/api/sound/generate` | 🟢 | **Yes** | Auth, validation, provider, generation, errors | API accepts/rejects and records failures |
| **S4** | Credits | Shared credit system | 🟢 | **Yes** | Reserve / retain / refund | No generation consumes credits incorrectly |
| **S5** | R2 | Shared storage | 🟢 | **Yes** | Successful Sound output to R2, namespaces, metadata | Generated Sound persistently stored/retrievable |
| **S6** | Sound D1 | Sound database | 🟢 | **Yes** | Sound generation/input/parameter/composition persistence | D1 supports lifecycle |
| **S7** | Sound inputs | `sound_generation_inputs` | 🟢 | **Yes** | Text/assets/Voice/etc. inputs | Inputs persisted/passed through |
| **S8** | Sound parameters | Creative parameters | 🟢 | **Yes** | Mood, style, energy, texture, tempo, intensity, complexity, vocals, language, negative/provider-specific parameters, capability-driven parameter representation | Creative intent represented provider-independently and passed through the Sound generation path |
| **S9** | Sound Studio UI | Frontend workspace | 🟢 | **Yes** | Complete conversational SvaraFlow Sound Studio UI, Direct Mode, capability-driven adapter controls, Existing Voice library workflow, voice/script context, proposal presentation, conversation height, interaction polish, and end-to-end generation UX | Sound Studio UI is fully complete and reliable end-to-end |
| **S10** | Output playback | Audio player | 🟢 | **Yes** | Waveform, playback, volume, output controls | User previews Sound |
| **S11** | Existing Voice → Sound | Cross-domain workflow | 🟢 | **Yes** | Existing Voice as Sound input | Voice drives Sound creation |
| **S12** | SvaraFlow Sound | Intelligence/orchestration | 🟢 | **Yes** | Understand content/intent, map to Sound specification/provider capabilities | SvaraFlow prepares Sound requests |
| **S13** | Generation history | Recent generations + Composition mini-library | 🟠 | **Next** | Complete Sound generation history and add a mini-library showing compositions only, analogous to the Sound mini-library | User can reliably find/reuse Sound generations and open existing compositions from the mini-library |
| **S14** | Composition engine | Multi-track composition | 🟢 | **Known-working baseline locked** | Current Compose workspace: master timeline, true source waveforms, shared time geometry, transport, track positioning, scrolling, playback and existing controls | Compose is stable and useful without adding unnecessary DAW complexity |
| **S15** | Composition persistence | Composition DB | ⚪ | **Next after S13** | Persist user compositions only; store references to existing R2 Voice/Sound assets plus composition state and user edits. Do not duplicate individual track media | User compositions survive and can be reopened/reused |
| **S16** | Export | Composition render/export | ⚪ | **Planned** | Render all referenced tracks with user edits such as position, volume, mute/solo and fades into a single composition; provide WAV and MP3 download and save rendered output to R2 using default filename `svaraone-composition-YYYY-MM-DD-HH-MM` | User can render, download and persist a finished composition |
| **S17** | My Library | Cross-domain asset management | ⚪ | **Planned** | Extend My Library to provide full control of Voice, Sound and Composition assets | One consistent library gives users full control of all three asset types |
| **S18** | Future | To be determined | ⚪ | **Not defined** | Inspect current functionality after S17, then deliberately define the next requirement | Next phase is based on actual product needs, not assumptions |
| **S19** | Future | To be determined | ⚪ | **Not defined** | Decide after S17/S18 assessment | Deliberate roadmap decision |
| **S20** | Future | To be determined | ⚪ | **Not defined** | Decide after S17/S18 assessment | Deliberate roadmap decision |
| **S21** | Future | To be determined | ⚪ | **Not defined** | Decide after S17/S18 assessment | Deliberate roadmap decision |
| **S22** | Future | To be determined | ⚪ | **Not defined** | Decide after S17/S18 assessment | Deliberate roadmap decision |
