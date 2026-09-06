# TODO

**Key**
- [ ] TODO
- [-] Hold off / Pause
- [Z] Canceled / Impossible
- [/] In progress
- [x] DONE
- [o] TBD

## **DO NOW**
- [ ] Add statusbar (top or bottom, either way) to view [METRICS](#metrics)
  - [ ] LOG TO GOOGLE SHEETS
- [ ] Change markdown importing style to handle scenes, further promp notes, perhaps just using a Key: Value style under each chapter, speaker, scene, etc.
- [ ] or instead of that... GOOGLE DOCS ALREADY
  - [ ] probably make sure markdown goes through a pass to remove backslashes and replace double & single quotes with normal ASCII 
- [x] Test snippet selection
- [Z] BIG CRAP FAILURE. Add and test the new ["Interactions"][geminiTTS] API
- [x] Implement multi-speaker API calls (but to use single-speaker you have to switch and shit, fukken annoyin')
  - [x] Fix prompt template, integrating
  - [/] Test generation of multiple snippets (same instructions and text) combined, ~500b, ~2kb, 4kb, 6kb, both in sequence and using the multi-speaker request config

## General
- [x] Create Readme, Changelog, Todo, and agent instructions
- [ ] Priorities, dammit!

## Metrics
- [ ] Collect: timestamp, req status, (error ID, error msg on failure), project name, # req snippets, # raw chars, # prompt chars, # raw words, # prompt words, req tokens, response tokens, audio size, audio duration
  - [ ] Same philosophy as Activity Watch: collect now, query later.
  - [ ] This will use a google sheet like `AudiobookStudioLog yyyy`, perhaps with a new sheet/tab per month. I don't think per-day sheets are necessary since my usage isn't very steady, spending more time writing, or working on the app, or generating and fine-tuning, and only the latter would produce log entries of course.
- [ ] Display status on UI statusbar: selected characters / tokens to stay under 8KB limit as well as total request data:
  - [ ] # requests, # chars, words, tokens, audio size, duration, etc. per day/hour/etc.
- [ ] Add a simple function to send an API call to the countTokens

## UI / UX
- [x] Speaker previewing
- [x] Each snippet and chapter displays the cumulative number of characters, words, and approximate request token count.
- [ ] Auto-focus currently playing snippet (add settings toggle)
- [-] (If necessary) More performant rendering, culling off-screen elements until they're within a certain range of the client area.
- [ ] Implement lightweight markdown syntax highlighting editor to prompt editor, speaker instructions, scene instructions, and *all* snippets assuming it's performant (likely react-md-edit or something)
- [ ] Rough approximation of text highlighting during playback based on audio length / word count
- [ ] Add a "command palette" to execute a section of the editor commands
  - [ ] This will depend on creating [command registry](#command-registry)

### Navigation
- [ ] A quick-navigation feature (Ctrl+G Goto Line, Ctrl+Shift+O Goto Symbol) to live-filter snippets matching a string. By default, searching like `.*term.*` unless the string contains `* | ?` and then use the exact search, replacing `*` with `.*` and `?` with `\\S`
  - [ ] Add targeted searching via properties / scopes like GitHub (basically just matching the same snippet interface property value) like `Speaker: Jane` or `Voice: Kore` or `MinLength: 20` or `MaxWords: 10` or `Generated: true` etc.
  - [ ] Include a regex option, naturally, like `/^\\w+:(?= )` to match all attributed text lines or `/\\b\[[\\w ,]+\]\\b/` to match all text with directions
- [ ] [Keyboard shortcut](NOTES/KEYBOARD_SHORTCUT_IMPLEMENTATION.md) settings schema with mappable commands
  - [ ] Keyboard Settings interface
  - [ ] Keyboard command handler / shortcut mapping which will require [command registry](#command-registry)

### Custom Theming
- [ ] Create discrete UI element names to make theming and even UI interaction tracking *way* easier. Possibly base it on Zed? Perhaps just use CSS directly like Atom did? or SCSS/LESS? Also see: Obsidian's own theming format and the two One Dark themes I found
- [ ] This will depend on having an easy, reusable set of multiple UI scope names
- [ ] Decide on a customizable theme format with automatic dark and light defaults.
  - [ ] See how the PS Universal theme works with base colors and then secondary, gamma, and delta values. Might be a lark?
  - [ ] Theme editing / importing -- perhaps use terminalcolors repo for basic 16-color palettes to add quick variety.
  - [ ] Count up the individual UI element colors and map between UI elements in VS Code, Atom, Zed, whatever.
  - [ ] Compare VS Code UI scope names with Zed UI scope names and Atom UI scope names and Obsidian scope names and... (etc.). It shouldn't be *too* difficult to make a list. Be sure to include Markdown syntax colors for snippets, instructions, prompt editor, etc.

```css
.Control {
  BG: hsl(220, 0.5, 0.3);
  FG: hsl(220, 0.6, 0.8);
  Border: hsl(220, 1.0, 1.0);
}
.Control.Button { // checkbox, textarea, etc.
  FG: hsl(220, 0.5, 0.7);
}
.Window { // Window.Header, Window.StatusBar, etc.
  // states: idle, hover, active, focused, disabled
}
```

### Undo / Redo System
- [ ] This will depend on building the [Command Registry](#command-registry)
- [ ] clipboard paste support -- split text at newlines and append to current chapter, *or* if snippets are selected, perform a diff across the selected snippets and the text in order -- so if 3 snippets are selected and the clipboard contains 5 paragraphs, compare paragraphs 1 - 3 against the snippets, appending the rest to the end. alternately... if no snippets are selected, diff each paragraph against each snippet in the current chapter, and if the similarity is > a certain amount, update its text

### Settings Dialogue
- [x] Implement plan laid out in [SETTINGS_OVERHAUL_IMPLEMENTATION_PLAN](./NOTES/SETTINGS_OVERHAUL_IMPLEMENTATION_PLAN.md)
- [x] A ~80% client size tabbed settings window (or draggable, resizable windows that don't block input) to make room on the sidebar for snippet generations, chapters, and scenes
  - [x] **Project settings tab**. Model, audio format, export concatenation options like per-paragraph or per-scene or per-chapter etc., audio export format, sample rate, bit rate, API (generateContent or Interactions), encrypted API key / GCP secret storage if possible
  - [x] **Speaker config tab**. Larger area to configure each speaker with separate profile/context and speech settings
    - [x] Editable combobox to filter voices using properties of the `VoiceProfile` interface (perhaps displaying as little pill tags or something for each voice): Name, Gender, Pitch, Tone, Description.
  - [x] **Scene config tab**. To configure separate scenes which will be assigned to contiguous snippets to be sent as a single API request, so long as there's no more than 2 speakers and 8kb total prompt
  - [ ] **Full prompt editor**. The generated prompt that will be sent with each API request (minus snippet content) using a markdown text editor like *react-markdown* or *react-md-editor*, using the [prompt structure defined here][promptSchema]
- [x] A slim selectable list similar to the Chapter list on the sidebar will remain to apply configured speakers to snippets, scenes, etc. Each just showing character name and voice, getting assigned a random color from a palette corresponding to the current theme, as well as a G.
- [x] Remove chapter containers from the main view to make maximal room for snippets, showing them one chapter at a time, with a slim chapter list / selector on the sidebar
- [x] A checkbox or other method of marking multiple snippets (only within the same chapter) for generation, speaker and scene assignment, deletion, movement to other chapters, etc.
  - [ ] Use a ctrl+click / shift+click selection method?
  - [ ] Generation button for multiple snippets only activates so long as <= 2 speakers total selected and <= *8KB* of total prompt, adding in speaker instructions, scene description, context, etc.
- [x] Support building different "scenes", similar to speakers, with their own instructions, which can then be assigned to one or more snippets (ideally contiguous) to be generated at the same time within limits (8KB full prompt, 10m55s exported audio)

### Statusbar with stats and status messages
- [ ] A more accurate token count that takes the full prompt with instructions into account using the [`countTokens()` method][tokenCount]
- [ ] Current cached audio size ... maybe look into [context caching][contextCaching] as well
- [ ] A *very* rough time-to-generate estimate for each snippet, chapter, and full project. (32t / sec?)
  - [ ] I'm currently collecting data to *very roughly* estimate the average time it takes to make an API request per-character, word, or token.
- [ ] A progress indicator w/ *approximate* time left on generation, based on the above data.
- [ ] Estimated full audio length & file size based on the selected format, total size of generations, and estimated size of snippets without generations.
- [ ] Cumulative tokens used for the project (perhaps saved in the project file), possibly with a price estimate or whatever.

### Project Configuration / Schema

## Audio Export
- [x] Full-chapter and project audio export
- [ ] Export audio encoding, primarily M4B/AAC, with...
   - [ ] M4B
   - [ ] M4A
   - [ ] MP3
   - [ ] FLAC
   - [ ] OGG Opus and/or Vorbis
   - [ ] Perhaps two separate settings: container and codec, which each have an array of which codecs/containers they can use to validate compatibility before generating.
- [ ] Look into what format ACX expects and implement
- [ ] Support uploading cover artwork to embed in the audio file metadata
- [ ] For M4B, M4A, MP3, Opus, and whichever other containers support it: timestamped text inserted from the project into container metadata as synchronized lyrics, using whatever format

## Project State Saving / Loading
- [ ] Single load / save project that automatically loads the audio sidecar file (if it exists), and if it doesn't, will show a modal dialogue of some sort warning about this, as well as a small button somewhere to load an audio sidecar file.
- [ ] Saving preferences separate to the project file with an option to include project-specific settings that override global -- much like workspace and folder options override user settings in VS Code

## API Features / Backend
- [ ] ADD THE GDAMN GDOCS API FFS AND STOP IMPORTING AND EXPORTING MARKDOWN GOT DAMN JUST GET IT DIRECTLY YOU FOOL
- [x] Add a "temperature" setting.
- [ ] Look into creating a UI focus... watcher? Service? to make [keyboard shortcut commands](#navigation) and general event handling easier (possibly), again with VSCode-like "when" context scopes like textEditorActive + settingsDialogueActive + speakerSettingsActive + speakerInstructionFocused. This would rely on the [Command Registry](#command-registry) though 
- [ ] the interface should have an enum property for access/mode, like 'user', 'debug', 'dev', 'admin' and each command in the registry is made available when the palette is invoked, along with connected keyboard shortcuts, and UI button actions. on condition that `currentMode >= <command>.mode`, i.e. a command for "clear indexed db cache" might have a 'debug' level with a value of 1, and our currentMode == 'dev' (2), so 2 >= 1 and it shows up.
- [ ] If this is ever hosted somewhere public, accepting a Gemini API key or else authentication with a Google account with Gemini / Cloud access
  - [ ] Also displaying its current quota. Or even just displaying my *own* quota lol.
- [ ] An API endpoint to use the asynchronous audio generation in order to start and stop previewing without having to generate the full text.
- [ ] Implement [Batch API](https://ai.google.dev/gemini-api/docs/batch-api#javascript_1) for generating full projects or chapters (i.e. > 10 parallel requests)

## Gemini API Handling (i.e. shit you have to infer and run tests on to deteremine how it *actually* works)
- [x] Migrating to multi-speaker audio generation template which is largely the same, except you define an array of speakers (up to 2 currently) and tag them in the script. This will enable generating multiple contiguous snippets at once so long as it doesn't use more than 2 speakers and the total amount of text doesn't exceed 8KB. See [Gemini TTS prompting guide][promoptSchema] for detailed info.
- [ ] Parallel generation requests... assuming that's possible with the same key.
  - [ ] Determine how many parallel requests can be made before a hard limit, or before it gets laggy, etc. According to the Gemini model docs, implicit [context caching][contextCaching] happens when requests are made closer together, so that's good.
  - [Z] *Only for text models!* Currently, each snippet is generated independently, i.e. one snippet : one API call. So, there may be voice drift if the speaker instructions are too general or generated far apart; implicit context caching kicks in when requests are made with the same instructions close together in time.
- [ ] Flagging snippets when they likely won't generate -- the Vertex API or Gemini models *really* do not like snippets under a certain length, or that only contain sounds like [cough] [snort] [laugh] etc.
   - [ ] Try to minimize prompt classifier false rejections: `Vague prompts may fail to trigger the speech synthesis classifier, resulting in a rejected request (PROHIBITED_CONTENT) or causing the model to read your style instructions and director's notes aloud. Validate your prompts by adding a clear preamble instructing the model to synthesize speech, and explicitly label where the actual spoken transcript begins.`


[promptSchema]: https://ai.google.dev/gemini-api/docs/generate-content/speech-generation#prompting-guide "Gemini prompting guide"
[tokenCount]: https://ai.google.dev/gemini-api/docs/generate-content/tokens#count-tokens "Gemini Token Counting"
[geminiTTS]: https://ai.google.dev/gemini-api/docs/speech-generation#javascript "generateContent / Interactions API"
[contextCaching]: https://ai.google.dev/gemini-api/docs/generate-content/caching "Context Caching"
<!--

EOF

-->