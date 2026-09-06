# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.13.1] - 2026-09-01

### Fixed
- Resolved `Missing required parameter client_id` by implementing client-side Firebase Auth popup integration with `firebase-applet-config.json` for Google Workspace OAuth token acquisition with memory-only token caching.
- Provisioned cloud OAuth client configuration for Google Sheets scopes.

## [0.13.0] - 2026-08-31

### Added
- Implemented Google Sheets Generation Telemetry Logging:
  - Added `sheetsService.ts` for managing annual spreadsheets (`AudiobookStudioLog yyyy`) with monthly tabs (`yyyy-MM`), column headers, and row appending.
  - Added `googleAuthService.ts` providing client-side Google Workspace OAuth token acquisition using Google Identity Services (`initTokenClient`).
  - Added `generationLogger.ts` utility to format and asynchronously append single-speaker and multi-speaker TTS telemetry rows without blocking playback or UI threads.
  - Added "Google Sheets Logging" tab to `SettingsDialogue.tsx` with one-click Google Account connection/disconnection, automatic logging toggle, target spreadsheet ID/URL configuration, and one-click new spreadsheet creation.
  - Added token and execution metrics reporting to `server.ts` and `geminiService.ts` returning `responseTimeMs`, `promptTokens`, `responseTokens`, and `totalTokens`.
  - Added unit test suites `tests/sheetsService.test.ts` and `tests/generationLogger.test.ts`.

## [0.12.1] - 2026-08-30

### Fixed
- Fixed sidecar JSON parser in `parseSidecarStream` failing on generations containing nested arrays (such as `snippetId: string[]`) by appending closing brackets `]` to the item buffer when `itemDepth > 0`.
- Added support for `"data"` property as an alternative to `"audioData"` and array format for `snippetId` during sidecar streaming import.
- Fixed "Scroll to Top" button by attaching `scrollContainerRef` to the active chapter scrollable viewport rather than `window`.
- Added audio data validation to "Export Concatenated Chapter Audio" and "Export Concatenated Audiobook" to verify audio exists in IndexedDB before generating files, preventing 1KB empty WAV file exports. Deduplicated contiguous snippets sharing the same active generation during concatenation.

## [0.12.0] - 2026-08-30

### Added
- Added streaming sidecar JSON importer (`src/utils/sidecarImporter.ts`) to stream large sidecar exports chunk-by-chunk and save audio directly to IndexedDB.
- Added import progress overlay showing processed megabytes, percentage, and parsed generation counts in real time.
- Added descriptive error formatting with byte location context for malformed or truncated JSON files.

## [0.11.1] - 2026-08-19

### Fixed
- Fixed sticky chapter header positioning by removing `overflow-hidden` on parent chapter container and pinning header cleanly to the top of the active chapter scroll area.
- Fixed `ResizeObserver loop completed with undelivered notifications` exception by observing snippet editor parent containers with debounced `requestAnimationFrame` height adjustments.

## [0.11.0] - 2026-08-19

### Added
- Implemented `GenerationGroupContainer` with yellow theme (`border-yellow-500/60`), custom editable generation label, cumulative text/token stats, and vertical iconified playback controls wrapping contiguous snippets sharing an active generation.
- Added `groupSnippetsByGeneration`, `formatDefaultGenerationLabel`, and `calculateGenerationStats` utilities for multi-snippet generation clustering.
- Added backend endpoint `/api/count-tokens` and frontend service `getTokenCount` for accurate Gemini token counting.
- Added `N/T` snippet index pill (e.g., `3/24`) next to the snippet checkbox for immediate position awareness within chapters.
- Added "Scroll to top" button to chapter header actions.
- Added continuous playback traversal supporting generation group steps via `playFromSnippetById`.

### Changed
- Unified Chapter Header with sticky layout and dynamic stats sub-row showing selection metrics (selected characters/words, full prompt characters/words, and overhead characters) when snippets are selected, or chapter metrics when none are selected.
- Updated bulk action buttons in selection header to clean labels ("Generate", "Delete") without redundant "selected" suffix.
- Auto-sized speaker and scene dropdown selector widths to fit content (`w-auto` / `max-w-[180px]`).
- Reordered snippet action buttons: moved `Add Below` between `Combine with Next` and `Delete`.

### Fixed
- Fixed audio sidecar generation duplication by deduplicating unique generation IDs during export.
- Reduced audio sidecar JSON payload size by removing redundant metadata fields (`text`, `speakerId`, `model`, etc.) from exported generation items and storing snippet associations as `snippetId: string[]`.
- Updated sidecar import logic to support minimal generation payloads while maintaining backwards compatibility with legacy sidecar files.

## [0.10.0] - 2026-08-07

### Added
- Implemented streaming sidecar JSON export (`exportSidecarStream`) using `FileSystemWritableFileStream` via `window.showSaveFilePicker()` when supported, with chunked Blob stream fallback for browsers without File System Access API.
- Replaced monolithic in-memory array aggregation during audio sidecar export to stream audio records directly from IndexedDB without loading all base64 buffers into a single JS object.
- Added progress feedback during sidecar export in the main application header.

## [0.9.3] - 2026-08-06

### Fixed
- Fixed empty voiceName fallback in combined TTS generation mode when single-speaker or single-snippet selections are synthesized, preventing 500 internal server errors.

## [0.9.2] - 2026-08-06

### Added
- Implemented rate-limited parallel batch execution for individual audio generation mode (max 9 concurrent requests, max 10 requests launched per 60-second window) across bulk selection, chapter generation, and generate-all actions.
- Added temperature tracking and badge indicators to Generation objects and Generation History cards in the sidebar.

### Changed
- Updated Prompt Template Editor and prompt compiler to map `{scene_context}` to `activeScene.context || activeScene.description || "No context."` and removed redundant `{scene_description}`.
- Interactions API is not to be used until such time as I figure out what its stupid problem is, perhaps contacting support about it.
- Commented out a few sections of the Interactions request object that I'm not positive are supported, such as previous_interaction_id, safety_settings, etc.
- Included a TTS request example *direct* from [their stupid documentation](https://ai.google.dev/gemini-api/docs/speech-generation#javascript) to test later. perhaps passing certain settings is limiting which models can be called, I don't know.
- `server.ts` had `speech_config` check for `requestSpeakers.length > 1` instead of 0 so only two speakers will map, otherwise one, as the multi-speaker endpoint won't accept a single array object with both name/voice, *I think*.

### Fixed
- Fixed snippet splitting logic to pass down parent `sceneId` to both child snippets.
- Added confirmation modal and Trash icon button for chapter deletion in active chapter header.
- Ensured `activeGenerationId` is validated against the snippet `generations` array before enabling playback or export controls.

## [0.9.1] - 2026-07-27

### Fixed
- Unified prompt compilation across TTS execution and Settings prompt preview by making `compilePrompt` in `src/utils/promptCompiler.ts` the single source of truth.
- Fixed multi-speaker template interpolation issue where secondary speaker blocks were missing replaced `{speaker_role}`, `{speaker_voice}`, and `{speaker_instructions}` variables.
- Implemented mode-aware prompt preview selection logic in `compilePrompt` (`individual` mode: selected snippet -> focused snippet -> first snippet of active chapter; `combined` mode: selected snippets -> first scene assigned snippets -> first 10 snippets).
- Fixed scene section rendering logic in prompt preview to omit scene header block when no active scene is assigned to selected/focused snippets.

### Added
- Integrated collapsible side panels for Chapters, Scenes, and Speakers in the Studio left sidebar with toggle chevron indicators to streamline long multi-chapter project workflows.
- Introduced explicit **Audio Generation Strategy** configuration in Project Settings (`generationOption`: `individual` vs `combined`), separating API batching limits from export concatenation rules.
- Added daily JSONL logging for all server-side TTS requests (`logs/tts_requests_YYYY-MM-DD.jsonl`) tracking timestamp, API method (`Interactions` vs `generateContent`), character counts, and token usage statistics.
- Added `/api/tts/stats` backend endpoint returning daily TTS activity metrics.

### Changed
- Verified and refined server-side Interactions API handling in `server.ts` with correct variable scoping and parameter passing for `previous_interaction_id`, `speech_config`, and `response_format`.

### Fixed
- Fixed `{snippet_text}` prompt compilation in `SettingsDialogue.tsx` to prioritize active snippet selections across chapters and prevent fallback leakage of unselected chapter snippets.
- Fixed multi-speaker prompt block concatenation in `promptCompiler.ts` and `SettingsDialogue.tsx` to dynamically duplicate `{speaker_name}` blocks for all unique speakers in selected snippets, and updated `handleBulkGenerate` to execute combined multi-speaker generation when multiple snippets or `generationOption: 'combined'` is selected.

## [0.8.3] - 2026-07-23

### Fixed
- Fixed `{snippet_text}` interpolation in the settings dialogue prompt preview to filter and only include actively checked/selected text snippets if a selection is present. If no selection is active, it continues to fall back to compiling the entire active chapter, or the static fallback prompt scene if empty.

## [0.8.2] - 2026-07-23

### Fixed
- Fixed `{snippet_text}` and `{chapter_title}` interpolation in the settings hub compiled prompt markdown preview to dynamically render the actual text snippets and title from the active chapter (with a fallback to the static romantic cafe scene mock text if no active chapter or text snippets are found).

## [0.8.1] - 2026-07-23

### Fixed
- Fixed key event bubbling in the voice combobox search panel where pressing ArrowUp or ArrowDown would double-fire and increment or decrement the active index by 2.
- Fixed the prompt editor's "Reset Default" button by replacing browser `confirm()` with a custom, inline confirmation toggle to prevent crashes inside sandboxed iframe containers.
- Replaced all other occurrences of browser `window.confirm` and `alert` (in bulk snippet delete, chapter deletion, and character bulk generation) with a modern, non-blocking React-based custom dialog modal.

## [0.8.0] - 2026-07-23

### Added
- Integrated **Scenes List** section directly into the left Studio Panel (positioned between Chapters and Speakers) to provide convenient visibility, selection, and bulk scene assignment capabilities.
- Added support for automatic creation of a new Character Speaker when clicking the `+` button in the Speakers studio panel list, opening settings directly to the Speakers tab.
- Added support for automatic creation of a new Acoustic Scene when clicking the `+` button in the Scenes studio panel list, opening settings directly to the Scenes tab.
- Added full import and export support for defined Scenes lists and snippet `sceneId` bindings within project JSON save files.

### Changed
- Removed the secondary "Delete Chapter" action button from the active chapter's header panel to clean up workspace clutter, leaving deletion safely positioned on the sidebar list.

### Fixed
- Fixed the "Reset Default" button inside the Prompt Template Editor tab of Settings to explicitly set its element type to `button` and prevent default form actions, restoring prompt layout resets.

## [0.7.2] - 2026-07-23

### Fixed
- Fixed a React "Rendered more hooks than during the previous render" runtime exception in the Settings Dialogue. All hooks are now declared unconditionally before any early-return checks, satisfying React's Rules of Hooks.
- Guarded character speaker state property accesses inside keyboard navigation event handlers with optional chaining and fallback bounds.
- Added comprehensive JSDoc comments to newly implemented helper functions in the Settings Dialogue.

## [0.7.1] - 2026-07-23

### Fixed
- Updated Prompt Template Editor in the Settings Dialogue to default to the modern format centered on `{speaker_name}`, `{speaker_role}`, `{speaker_voice}`, and `{speaker_instructions}`.
- Added live, real-time preview assembly substituting project title, chapter title, speaker details, role, scene description, scene context, and sequential transcript dialogue.
- Moved the 'Variables:' helper chips block above the template textarea so it wraps beautifully and does not overlap with the markdown preview.
- Restored functional behavior to the `Reset Default` button using the new default template.
- Integrated automated real-time template validator that blocks saving if mandatory fields (`{speaker_name}`, `{speaker_voice}`, `{speaker_instructions}` / `{speaker_style}`, and `{snippet_text}`) are absent.
- Added a `role` attribute input field to the character speaker editing tab, with auto-fallback to "Narrator" when making a character the default narrator.
- Enhanced the custom searchable voice profile combobox with keyboard arrow navigation, enter-to-select, escape-to-close, and automatic search focus on open.
- Cleaned up unfinished, unused `src/utils/logWriter.ts` file to ensure clean TypeScript compilation.

## [0.7.0] - 2026-07-23

### Added
- Created `/src/utils/promptCompiler.ts` with `compilePrompt` to dynamically interpolate project, chapter, scene, context, and contiguous narrator/speaker scripts into user-configured prompt templates.
- Added formal `promptTemplate` string property to the `settings` sub-interface in `src/types.ts`.
- Integrated `getGenerationValidationState` dynamically into the "Generate Selected" bulk action button, auto-disabling the button and displaying descriptive validation warning tooltips (e.g., character limit or multi-speaker capacity warnings) on hover.
- `types.ts` added type `InteractionsMimeType` supported audio formats for the Interactions API
- `server.ts` added interactionsAPI placeholder to tts/generate api req
- `geminiService.ts` added interactionsAPI placeholder to tts/generate api call 
- `markdownParser.ts` added optional `stripQuotes: boolean` parameter to parseMarkdown to determine whether or not to strip surrounding quotes from speaking lines. it's sometimes useful to keep them when they're part of one block with both narration and speech for the character

### Changed
- Expanded `/src/App.tsx` `handleBulkGenerate` to handle multi-speaker synthesis. It executes validation, compiles templates, issues single multi-speaker API requests with exact character and prebuilt voice mappings, and updates all selected range blocks in a unified state.
- Updated `/server.ts` `api/tts/generate` endpoint to receive a contiguous `speakers` array configuration mapping speaker names to their corresponding voices, and invoke standard `generateContent` using `speechConfig.multiSpeakerVoiceConfig`.
- Updated client `generateTTS` in `src/services/geminiService.ts` to forward mapped speakers array values over the network.
- `data/Request Template.md` specified precisely how Scene and Context ought to be used
- `SettingsDialogue.tsx` modified prompt template
- Multi Snippet Generation plan with modified prompt generation template and instructions

## [0.6.3] - 2026-07-20

### Added
- `data/Request Template.md` request template / example
- `data/JSDocTemplate.ts` template because I keep forgetting what fields go in which. I really need to export this damn thing to VS Code or Antigravity or whatever so I have my snippets and everything

### Changed
- Renamed `PromptSchema-SingleSpeaker.md` to `Gemini Recommended Example Request.md`
- Renamed `GeminiExample.md` to `Request Template.md`
- `GEMINI.md`: Modified and clarified a lot regarding separate request/change and bug fix processes as well as some other details herea and there. No more updating `TODO.md` -- the files in the NOTES (should probably rename it PLANS huh?) folder will be the source of truth going forward in terms of concrete changes. they'll essentially be a "closed list" where `TODO.md` will be an "open list" that only I update with my harebrained ideas that get checked off as they're requested, worked on, and completed little by little.
- `TODO.md`: and naturally I've added more uh... "ambitious" ideas lol.

## [0.5.3] - 2026-07-18

### Fixed
- Fixed uncaught runtime TypeError ("Cannot read properties of undefined (reading 'replace')") when rendering older generations by adding optional chaining and fallback protection `(gen.model || 'unknown')` before string replacement.
- Defended `project.title` and `tempPromptTemplate` string operations from undefined/null exceptions.
- Added state synchronization in `SettingsDialogue` to update local modal inputs, character lists, and custom templates when opened or on project change.

## [0.5.2] - 2026-07-18

### Added
- Rendered the `<SettingsDialogue>` component in `App.tsx` main JSX return statement.

### Fixed
- Fixed typescript type mismatch in `src/services/markdownParser.ts` by assigning `GEMINI_MODELS[0]` instead of `GEMINI_MODELS[0].id` to the `model` property.

## [0.5.1] - 2026-07-18

### Added
- JSDocTeamplate.ts while I'm still within AI Studio

### Changed
- server.ts: Changed `import-parse` endpoint fallback `fallbackScriptParser()` to `parseMarkdown()`
- types.ts: Renamed `SUPPORTED_VOICES` to `GEMINI_VOICES` and updated references
- types.ts: Renamed `SUPPORTED_MODELS` to `GEMINI_MODELS` and updated references

### Removed
- server.ts: Removed `fallbackScriptParser()`
- App.tsx: Removed redundant and outdated `GEMINI_VOICES` interface
- App.tsx: Removed redundant and outdated `GEMINI_MODELS` interface

## [0.5.0] - 2026-07-18

### Added
- Integrated full `SettingsDialogue` component in `/src/components/SettingsDialogue.tsx` featuring a ~80% width tabbed layout.
- Added **Project settings tab** allowing config for model, container format, sample rate, bit rate, and export concatenation rules.
- Added **Speaker config tab** supporting searchable voice profiles with metadata attributes (Tone, Pitch, Description) and live previewing.
- Added **Scene config tab** allowing background context configuration per-scene for contiguous generation.
- Implemented multi-select checkbox buttons for all snippets in the active chapter.
- Implemented a sticky **Bulk Operations** action bar supporting batch speaker assignment, batch scene assignment, batch chapter migration, batch generation, and batch deletion.
- Implemented Track 1 of Settings Overhaul: Defined metadata schemas in `/src/utils/settingsSchemas.ts` and interface types in `types.ts` for dynamic generation and export configuration fields.
- Implemented the `DynamicSettingsForm` component in `src/components/DynamicSettingsForm.tsx` to programmatically render fields according to schema definitions.
- Created `preferenceService.ts` for persistent browser-side preferences, adding local storage sync and client-side API Key override configurations.

### Changed
- Refactored the core timeline to display only the active chapter in the central scrollable panel, maximizing text editing space.
- Moved chapter management (adding, ordering, deleting, and naming) entirely into a slim collapsible **Chapters section** on the sidebar.
- Redesigned the speaker panel in the sidebar as a compact, lightweight **Speakers selector**, showing color dots and voice indicators.
- Added quick "Apply to Focused/Selected" behavior when clicking any speaker in the sidebar list.
- Configured a convenient "G" generator key on the sidebar speaker rows to batch-generate all snippets in the chapter assigned to that speaker.
- Updated `/server.ts` and `/src/services/geminiService.ts` to support optional client-side API keys and custom temperature parameters on voice generation request payloads.

### Fixed
- Fixed typescript casting issues when processing bulk snippet lists inside async loops.
- Resolved nesting of Resizer Handles and wrapping div tags in the sidebar view.

## [0.4.1] - 2026-07-16

### Fixed

- Fixed an issue where the WaveformPlayer component would completely unmount and its floating toggle tab would disappear from the screen when audio playback was stopped. The player is now persistent, rendering a sleek idle or "No Active Segment" state when no audio is active while keeping the floating toggle tab fully accessible.

### Changed

- Configured the WaveformPlayer to automatically expand itself from its collapsed tab state as soon as active audio playback starts.

## [0.4.0] - 2026-07-16

### Added

- Created comprehensive documentation, including detailed `README.md` and initial `TODO.md`.
- Implemented robust background logging for Gemini API token counts and request timing in `server.ts`.
- Added support for fine-tuned voice properties (`tone` and `pitch` fields) in `SUPPORTED_VOICES` under `types.ts`.
- Implemented a detailed keyboard shortcut navigation architecture plan in `NOTES/KEYBOARD_SHORTCUT_IMPLEMENTATION.md`.

### Fixed

- Fixed audio playback container styling, resolving mouse cursor display bugs.
- Overrode Vertex/Gemini API safety thresholds in `server.ts` to `HarmBlockThreshold.OFF` to prevent false positive content blocks on classic literature or edgy book transcriptions.

### Changed

- Renamed the project in `package.json` to "Audiobook Production Studio".
- Standardized the Vite/Express full-stack dev and build system using `tsx` for high-performance live reloading and `esbuild` to compile a bundled, optimized CommonJS server at `dist/server.cjs`.

[unreleased]: https://github.com/tma-2/audiobook-studio/compare/v0.5.3...HEAD
[0.5.3]: https://github.com/tma-2/audiobook-studio/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/tma-2/audiobook-studio/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/tma-2/audiobook-studio/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/tma-2/audiobook-studio/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/tma-2/audiobook-studio/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/tma-2/audiobook-studio/compare/v0.3.0...v0.4.0
