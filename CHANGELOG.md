# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[0.4.1]: https://github.com/tma-2/audiobook-studio/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/tma-2/audiobook-studio/compare/v0.3.0...v0.4.0
