# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Single primary user (the developer/author), for personal use only. No multi-user, sharing, or public-facing use case is planned currently. The user is a fiction writer working through long-form projects (e.g. "Roommate Trap," ~13 chapters with a fixed structure in progress; "Maxine Maxim," more content overall but not yet locked into a final chapter chronology) who uses generated narration as a companion to drafting — a way to hear how characters and scenes might sound before committing to a final structure, not a finished-product pipeline in itself.

## Product Purpose

Audiobook Studio converts authored text (chapters and paragraph-level "snippets") into narrated audio using Gemini TTS voices, at whatever granularity the user wants: single snippet, chapter, or full project. It exists to let the user hear a work-in-progress read aloud with distinct character voices and natural-language performance direction, outside of any hosted walled-garden platform (Google AI Studio, Google Cloud Enterprise Agent Platform), so behavior, settings, and generated assets are fully under the user's own control rather than subject to a hosted UI's storage quirks (e.g. AI Studio storing system instructions in localStorage) or usage limits.

Success today means: reliably generating and comparing multi-take narrated audio for in-progress fiction, locally, without depending on AI Studio's UI. A longer-term aspiration (not a current requirement) is producing audio polished enough to inform submitting the underlying manuscript to a real narrator via ACX.

## Positioning

Distinct from audiobook-studio.com, which offers a similar chapter/snippet workflow and BYOK support for ElevenLabs, OpenAI, and Google Cloud TTS voices (Chirp3-HD, WaveNet, Studio) but not Gemini's multimodal TTS voices. Gemini 3.1 Flash TTS voices are, in the user's own testing against those alternatives, the most flexible available: they respond to natural-language direction (accent hints, delivery, emotional tone) in a way sample-based voice engines like ElevenLabs cannot, at the cost of being more prone to vocal drift over long generations.

Also positioned as an escape from two prior Google-hosted iterations of this same idea: an early prototype built with near-total creative freedom in Google Cloud Enterprise Agent Platform's app builder (since archived, its UI no longer resembles the current app), and a subsequent rebuild in Google AI Studio, which has a nicer interface but the same walled-garden constraints (opaque settings persistence, limited control over the assistant's own operating instructions, billing that defaults to a separate free tier disconnected from the linked GCP billing account).

## Operating Context

- Text is authored as Markdown, parsed into chapters (by `##` heading) and snippets (by paragraph/line break); a Characters section defines speakers, with one speaker markable as `Narrator: Yes` as the chapter default.
- Import today is plain text/Markdown only; direct Google Docs import is a near-term intended improvement (not yet built).
- Speakers are configured with a Gemini TTS voice, model, and free-form natural-language instructions (pacing, pitch, emotion, accent, custom direction).
- Scenes group snippets to give the model shared context beyond a single generation call.
- Generation accepts a contiguous run of snippets constrained to at most one scene and two speakers per request; multi-speaker requests measurably reduce (but do not eliminate) voice drift compared to single-speaker sequential calls.
- Output audio is L16 PCM at 24kHz, stored as base64 inside JSON generation records in IndexedDB, each tied to the snippet IDs it covers. Multiple takes ("generations") persist per snippet/range so the user can compare and pick.
- Audio can be exported per-snippet, per-scene, per-chapter, or for the whole project.
- Project state (text, structure, speakers, scenes) is saved as a `.absproject.json` file; generated audio is saved as a separate `.absproject.audio.json` sidecar file. Both must currently be saved/loaded together by hand; this split is a known rough edge, not an intended long-term design.
- The developer runs this locally via `npm run dev` (Express + Vite middleware), with Gemini access via either an AI Studio API key or a Vertex AI service account, selected via `.env` (`USE_VERTEX_AI`). Vertex is the path actually used for billed generation, since the AI Studio key defaults to an unrelated free tier.
- Current UI interaction is heavily mouse-driven; no keyboard command/shortcut layer exists yet, despite the user's preference for keyboard-driven workflows (not vim-level modal editing, but IDE-style discrete commands and bindings).

## Capabilities and Constraints

- Audio export format is L16 PCM @ 24kHz only today; this is a current limitation, not a permanent design boundary. Additional export formats (M4B and other standard audiobook formats) are wanted future capability.
- Gemini TTS generation exhibits audible drift (artifacting, volume drop, vowels closing up, harsher consonants) after roughly 90 seconds of continuous output, well short of the API's documented ~8k character input / ~10 minute output ceiling. This is a known, unresolved model limitation the app works around via scene/speaker grouping rather than a solved problem.
- The Interactions API (positioned by Google as the eventual replacement for `generateContent`) does not currently work for this app's TTS use case: it has rejected the Gemini 3.1 Flash TTS model with an unsupported-model error in testing, and does not support `safety_settings` customization, which the user needs since some manuscript content includes explicit scenes. The app currently uses `generateContent` for this reason.
- No accessibility standard is required. This is a personal production tool for a single sighted, keyboard-and-mouse desktop user; it is not intended for phone/tablet use.
- No multi-user, authentication-for-others, or public deployment requirement exists today.

## Evidence on Hand

- Real, substantial manuscript content exists and is actively used with the app: "Roommate Trap" (~13 chapters, chronology/structure already fixed) and "Maxine Maxim" (comparable or greater total content, chronology not yet finalized). Existing project files, audio sidecars, and speaker/scene definitions for these works exist on disk and are real evidence of actual use, not filler or demo content.
- The bundled sample project ("The Whispering Shadows," a short gothic dialogue scene in `server.ts`) is demo/onboarding content only, not representative of the user's real manuscripts.
- No testimonials, benchmarks, or third-party proof exist or should be implied; this is a single-user personal tool.

## Product Principles

- Independence from hosted-platform lock-in is a first-order goal, not incidental: every workflow decision should keep the user in control of settings, credentials, and generated assets rather than reintroducing a walled garden.
- Comparison-first iteration: the value of the tool is in generating and comparing multiple takes cheaply, not in producing a single "final" render on the first attempt.
- Drift and cost are real, active constraints the UI should keep visible and manageable (scene/speaker grouping, contiguous-range limits), not hidden failure modes.
- The tool supports the writing process itself (hearing a draft take shape) as much as it supports producing a finished audio artifact; workflow friction during early, exploratory drafting matters as much as final export quality.

## Accessibility & Inclusion

No accessibility standard is currently required. Single-user personal desktop tool; keyboard-driven efficiency is a workflow goal (planned command/keybinding layer) but is a usability preference, not an accessibility requirement.
