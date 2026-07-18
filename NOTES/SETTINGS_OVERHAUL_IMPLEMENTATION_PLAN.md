# Settings Overhaul Implementation Plan

Implementation notes and logs for the tabbed settings dialogue, multi-select bulk operations, and unified single-chapter layout update.

## Added
- Created a gorgeous `SettingsDialogue` in `/src/components/SettingsDialogue.tsx` featuring a ~80% width fluid, tabbed, high-performance interface.
- Integrated **Project settings tab** with model choice, audio container, sample rate, and export concatenation settings.
- Integrated **Speaker config tab** with voice profiles, gender tags, style contexts, combobox filters, and live-preview options.
- Integrated **Scene config tab** to define multi-character background context and physical/theatrical scenes.
- Added a unified header trigger for opening the settings dialog in `App.tsx`.
- Implemented multi-select checkbox buttons for all snippets in the active chapter.
- Implemented a sticky **Bulk Operations** action bar containing multi-snippet assignment (speaker, scene, chapter target), batch generation, and batch deletion.

## Changed
- Refactored the core timeline to display only the active chapter in the central scrollable panel, maximizing available text editing space.
- Moved chapter management (adding, ordering, deleting, and naming) entirely into a slim collapsible **Chapters section** on the sidebar.
- Redesigned the speaker panel in the sidebar as a compact, lightweight **Speakers selector**, showing color dots and voice indicators.
- Added quick "Apply to Focused/Selected" behavior when clicking any speaker in the sidebar list.
- Configured a convenient "G" generator key on the sidebar speaker rows to batch-generate all snippets in the chapter assigned to that speaker.

## Fixed
- Fixed typescript casting issues when processing bulk snippet lists inside async loops.
- Resolved nesting of Resizer Handles and wrapping div tags in the sidebar view.
- Ensured 100% clean linter compile and type safety.
