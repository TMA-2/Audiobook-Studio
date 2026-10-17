<!-- markdownlint-config
no-bare-urls: false
-->

# TODO

**Key**
- [ ] TODO
- [-] Hold off / Pause
- [Z] Canceled / Impossible
- [/] In progress
- [x] DONE
- [o] TBD

## Breaking News
> [!important] Gemini 3.8 TTS [[TODO#API Features / Backend|API Changes]]
> This will require some amount of re-design of the prompt template, obviously, as well as speaker handling, prompt template design, how best to handle generations (i.e. number of speakers, longer or shorter, separating requests by mood/emotion or delivery, etc.), and more.

- [ ] Speakers are handled now that they can be defined pre-hoc and return a persistent `voice_id` to use in subsequent requests.

## Bugs
- [ ] Identify and fix the [[TODO#Snippet Editor|Input lag issue]] in the snippet editor.
- [ ] Sheets service should try to authenticate when the app loads. Typically it'll just pop up a login box that disappears after two seconds and that's it. Or, if there's a way to tell when the token has expired, to automatically re-authenticate (possibly opening the window such that it doesn't steal focus, like a "pop-under")
- [ ] Fix the chapter header Prompt Chars, Prompt Words, and Overhead counts. It should work effectively the same as the prompt preview in settings for what it shows regarding snippet selection:
  - [ ] no snippets are selected: count all chapter snippets
  - [ ] one is selected: ...just that snippet
  - [ ] two or more are selected: ...just those snippets
- [ ] This god damn error has been plaguing it forever and I typically didn't notice because it just went to the console in AI studio
  - `var audioDuration = await getAudioDuration(audioData, resMimeType);`
  - ```log
    Error parsing audio duration: ReferenceError: Audio is not defined
    at <anonymous> (C:\Users\tma2\OneDrive\Source\audiobook-studio\src\services\audioService.ts:77:21)
    at new Promise (<anonymous>)
    at getAudioDuration (C:\Users\tma2\OneDrive\Source\audiobook-studio\src\services\audioService.ts:56:10)
    at <anonymous> (C:\Users\tma2\OneDrive\Source\audiobook-studio\server.ts:592:33)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    ```
  - [audioService](./src/services/audioService.ts:77)
  - [getAudioDuration](./src/services/audioService.ts:56)
  - [server](./server.ts:592)
  - [ ] also however exceptions are handled that show a msgbox probably needs to be changed to a custom modal or something because shit is hella annoying
- [ ] A similar error pops up maybe 1/3 of the time on playback, which seems to be a false positive of some sort, as after clicking through the alert, the generation plays fine.
  ```log
  08:47:53.427 audioService.ts:181 Audio playback error: EventisTrusted: truebubbles: falsecancelBubble: falsecancelable: truecomposed: falsecurrentTarget: nulldefaultPrevented: falseeventPhase: 0returnValue: truesrcElement: audiotarget: audiotimeStamp: 2883356.899999976type: "error"[[Prototype]]: Event
  audio.onerror @ audioService.ts:181
  ```
- [ ] Sheets logging is overwriting the same row continuously. Not sure why, given it's not having to check the last row written and then write to that index+1, it's just using the `append` method of the API. something's up, though, because it *has* logged many times, but looking at the edit history for the last few days, it continually writes to one row, so it's... stuck or something

### FIX THE GOD DAMN RAW CHARACTER COUNT LOGGING ALREADY
- [ ] Raw character & word count too small in logging.
- [ ] Map out the entire flow of a snippet generation request, from the moment the user clicks "Generate" to the final API call, including all intermediate steps, function calls, and data transformations. This will help identify where character counts may be miscalculated or lost.
1. `App.tsx` calls
    1. Character Preview: `generateTTS` with `options.textCharCount: previewText.length`
    2. `handleGenerateSnippetAsync` with `options.textCharCount: targetSnippets.map(s => {s.text.trim();}).join('\n').length;`
    3. `handleBulkGenerate` with `options.textCharCount: selectedSnippets.map(s => {s.text.trim();}).join('\n').length;`
2. `generateTTS` calls
    1. `/api/tts/generate` with `body.textCharCount: options.textCharCount`
3. API endpoint `server` calls
    1. `logInfo` with `charCount = rawTextCharCount = req.body.textCharCount`
4. logging service calls
    1. Local JSONL: [[./server.ts:36|`logTtsRequest()`]]
    2. Sheets: [[./src/utils/generationLogger.ts:78|`logGenerationEvent()`]]

Possible causes:
- Somewhere along the way, I think the `snippets.map({(s) => s.text.length})` gets sent through, and then at some other point before hitting the JSONL or Sheets, the length property is checked again, as it's not just 0 or 1 or null, it's almost always between 1 and 5 or so, which would make perfect sense if there's a redundant length check, which would type-coerce the number to a string and then get the length, e.g. a count of `954` == `954.toString().length` == `3`

## *Higher Priority*
- [ ] [[TODO#UI / UX|Auto-focus currently playing snippet (add settings toggle)]]
- [ ] Test snippet selection
- [x] Add and test the new ["Interactions"][geminiTTS] API
  - [x] Did that, it DOESN'T EVEN RECOGNIZE TTS MODELS, FUCK!
- [ ] Add statusbar (top or bottom, either way) to view selected chaaracters / tokens to stay under 8KB limit as well as total request data: # requests, # chars, words, tokens, audio size, duration, etc. per day. This will be read from a daily JSONL log which will write one entry per request with all the above fields. **Collect now, query later.**
- [ ] Change markdown importing style to handle scenes, further prompt notes, perhaps just using a Key: Value style under each chapter, speaker, scene, etc.
  - [ ] Run a cleaning pass on exported markdown because Docs is fucking *STUPID* how it exports markdown. it must miss a step in the chain of format shifts in and out of json and base64 and whatever other shit it passes through, because it ends up with *every* bit of punctuation escaped with a backslash. Thanks for nothing google.
  - [ ] `[\x{201C}\x{201D}]` for *FaNcY* double quotes
  - [ ] `[\x{2018}\x{2019}]` for *FaNcY* single quotes
  - [ ] `\\` for every backslash, as there's no legitimate need for them in any document that I can think of
- [x] Implement multi-speaker API calls (but to use single-speaker you have to switch and shit, fukken annoyin')
  - [x] Fix prompt template, integrating
  - [/] Test generation of multiple snippets (same instructions and text) combined, ~500b, ~2kb, 4kb, 6kb, both in sequence and using the multi-speaker request config

## General
- [x] Create Readme, Changelog, Todo, and agent instructions
- [ ] Priorities, dammit!

## Metrics
- [ ] Configure Vite to log each client connection and disconnection with IP and timestamp
- [x] Collect: timestamp, req status, (error ID, error msg on failure), project name, # req snippets, # raw chars, # prompt chars, # raw words, # prompt words, req tokens, response tokens, audio size, audio duration
  - [ ] Same philosophy as Activity Watch: collect now, query later.
  - [ ] This will use a google sheet like `AudiobookStudioLog yyyy`, perhaps with a new sheet/tab per month. I don't think per-day sheets are necessary since my usage isn't very steady, spending more time writing, or working on the app, or generating and fine-tuning, and only the latter would produce log entries of course.
- [ ] Display status on UI statusbar: selected characters / tokens to stay under 8KB limit as well as total request data:
  - [ ] # requests, # chars, words, tokens, audio size, duration, etc. per day/hour/etc.
- [ ] Add a simple function to send an API call to the countTokens

## Architecture
- [ ] **MAJOR:** Implement new project format: .abs file (zip) containing roughly the same project JSON format, plus the audio generations, now in binary format, identified by ID. No more Base64, the data shouldn't have to be streamed to IndexedDB to get around the 512MB JSON limit when it's literally just binary blob to binary blob.

## UI / UX

### Snippet Editor
- [ ] Fix text editing (and UI reactivity, I think) delay. Seems to be pretty directly correlated to the number of snippets in the chapter.
  - [ ] Keep the text in local state inside the textarea component and commit it to the project on a debounce (about 300 ms) and on blur or chapter switch. This alone fixes most typing lag.
  - [ ] Memoize the snippet row and give each row a selector so it only re-renders when its own snippet changes.
  - [ ] Debounce autosave, and write only the changed snippet. That matches the per-record storage you’ve been planning.
  - [ ] Add `content-visibility: auto` to off-screen rows, with `contain-intrinsic-size`. It skips layout and paint for rows nobody can see, and it addresses your “rendering off-screen” hunch, though not React’s own render cost.
  - [ ] Wrap the derived counts in `useDeferredValue` so typing stays higher priority than the numbers.
  - Claude's suggestion for agent
  ```md
  Typing in a snippet textarea lags in proportion to the number of snippets in
  the chapter (~250ms at 6, ~750ms at 30, dev build; INP trace is ~85%
  processing duration, not paint). Find what runs per keystroke with cost
  proportional to chapter/project size. Check: (1) is the textarea controlled
  by project-level state, and does onChange clone anything deeply; (2) which
  components re-render per keystroke (add console.count to the snippet row and
  chapter header); (3) where Chars/Words/Prompt Chars/Overhead/Txt/Sent are
  computed, and whether they call the prompt compiler for every snippet each
  render; (4) grep for JSON.stringify, structuredClone, scrollHeight, and
  .filter/.map in render bodies, and effects depending on project/chapter.
  Report findings before changing anything.
  ```

- [ ] Implement variability in UI element spacing so it can be more compact or more spaced out depending on user preference, similar to how VS Code allows for "compact" or "comfortable" UI density settings.
- [ ] **LOW PRIORITY** The site is unusable on mobile. I thought the whole idea of handing off design to React and similar was that they would, insofar as you allow them, automatically re-arrange controls so it'll be at least partially usable on small screens. However, on my Pixel 7, which has a 2400x1080 resolution, it barely shows past the sidebar.
- [x] Speaker previewing
- [x] Each snippet and chapter displays the cumulative number of characters, words, and approximate request token count.
- [x] Auto-focus currently playing snippet (add settings toggle)
- [-] (If necessary) More performant rendering, culling off-screen elements until they're within a certain range of the client area.

### Command Registry
- [ ] Implement a command registry for each discrete UI action to handle keyboard shortcuts and other commands, similar to VS Code
- [ ] A context watcher that tracks which UI element is currently focused, and what the current state of the app is (e.g. snippet editor focused, settings dialogue open, etc.) to determine which commands are available at any given time.
  - [ ] Perhaps include a visualization of the current context and available commands for debugging purposes modeled after Zed's keyboard context view
- [ ] Add a "command palette" to arbitrarily invoke a [[CMD_REG_AND_KEYBOARD_SHORTCUT_IMPLEMENTATION|Command Registry entry]]

### Navigation
- [ ] A quick-navigation feature (Ctrl+G Goto Line, Ctrl+Shift+O Goto Symbol) to live-filter snippets matching a string. By default, searching like `.*term.*` unless the string contains `* | ?` and then use the exact search, replacing `*` with `.*` and `?` with `\\S`
  - [ ] Add targeted searching via properties / scopes like GitHub (basically just matching the same snippet interface property value) like `Speaker: Jane` or `Voice: Kore` or `MinLength: 20` or `MaxWords: 10` or `Generated: true` etc.
  - [ ] Include a regex option, naturally, like `/^\\w+:(?= )` to match all attributed text lines or `/\\b\[[\\w ,]+\]\\b/` to match all text with directions
- [ ] [Keyboard shortcut](./NOTES/CMD_REG_AND_KEYBOARD_SHORTCUT_IMPLEMENTATION.md) settings schema with mappable commands
  - [ ] Keyboard Settings interface
  - [ ] Keyboard command handler / shortcut mapping which will require [[#command regist]] implementation

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
- [ ] Implement a command history stack that tracks all discrete actions taken in the app, allowing for undo and redo functionality.
  - [ ] The obvious and lazy implementation would be to save snapshots of the project file/object, every editable UI element, so all chapters and snippets, all settings, etc.
  - [ ] The better way would obviously be to only save the object that the command affected, e.g. `{Command: snippet.editText, ID: "1234", OldState: {Text: "Hello"}, NewState: {Text: "Goodbye"}}`
- [ ] clipboard paste support -- split text at newlines and append to current chapter, *or* if snippets are selected, perform a diff across the selected snippets and the text in order -- so if 3 snippets are selected and the clipboard contains 5 paragraphs, compare paragraphs 1 - 3 against the snippets, appending the rest to the end. alternately... if no snippets are selected, diff each paragraph against each snippet in the current chapter, and if the similarity is > a certain amount, update its text

### Settings Dialogue
- [ ] Add an editbox for the speaker preview text with a selection of default phonetic pangrams.
- [ ] Implement lightweight markdown syntax highlighting editor to prompt editor, speaker instructions, scene instructions, and *all* snippets assuming it's performant (likely react-md-edit or something)
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

### Statusbar
- [ ] Add a statusbar at the bottom of the app to display current project, chapter, snippet, and selection information, as well as generation progress and other relevant metrics.
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
- [ ] ADD THE GDAMN GDOCS API FFS AND STOP IMPORTING AND EXPORTING MARKDOWN GOT DAMN JUST GET IT DIRECTLY YOU EEL
- [x] Add a "temperature" setting.
- [ ] Look into creating a UI focus... watcher? Service? to make [[CMD_REG_AND_KEYBOARD_SHORTCUT_IMPLEMENTATION#Keyboard Implementation via Command/Event Registry Model|keyboard shortcut commands]] and general event handling easier (possibly), again with VSCode-like "when" context scopes like textEditorActive + settingsDialogueActive + speakerSettingsActive + speakerInstructionFocused. This would rely on the [Command Registry](#command-registry) though 
- [ ] **LOW** the interface should have an enum property for access/mode, like 'user', 'debug', 'dev', 'admin' and each command in the registry is made available when the palette is invoked, along with connected keyboard shortcuts, and UI button actions.
  - e.g. on condition that `currentMode >= <command>.mode`, i.e. a command for "clear indexed db cache" might have a 'debug' level with a value of 1, and our currentMode == 'dev' (2), so 2 >= 1 and it shows up.
- [ ] If this is ever hosted somewhere public, accepting a Gemini API key or else authentication with a Google account with Gemini / Cloud access
  - [ ] Also displaying its current quota. Or even just displaying my *own* quota lol.
- [ ] An API endpoint to use the asynchronous audio generation in order to start and stop previewing without having to generate the full text.
- [ ] Implement [Batch API](https://ai.google.dev/gemini-api/docs/batch-api#javascript_1) for generating full projects or chapters (i.e. > 10 parallel requests)
- [ ] Implement [streaming API](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation#streaming) ([Interactions API version](https://ai.google.dev/gemini-api/docs/speech-generation#streaming)) to test how well it works vs. synchronous, or if the drift is any different, esp. using podcast-like multi-speaker mode.

## Gemini API Handling (i.e. shit you have to infer and run tests on to deteremine how it *actually* works)
- [x] Migrating to multi-speaker audio generation template which is largely the same, except you define an array of speakers (up to 2 currently) and tag them in the script. This will enable generating multiple contiguous snippets at once so long as it doesn't use more than 2 speakers and the total amount of text doesn't exceed 8KB. See [Gemini TTS prompting guide][promoptSchema] for detailed info.
- [ ] Parallel generation requests... assuming that's possible with the same key.
  - [ ] Determine how many parallel requests can be made before a hard limit, or before it gets laggy, etc. According to the Gemini model docs, implicit [context caching][contextCaching] happens when requests are made closer together, so that's good.
  - [Z] *Only for text models!* Currently, each snippet is generated independently, i.e. one snippet : one API call. So, there may be voice drift if the speaker instructions are too general or generated far apart; implicit context caching kicks in when requests are made with the same instructions close together in time.
- [ ] Flagging snippets when they likely won't generate -- the Vertex API or Gemini models *really* do not like snippets under a certain length, or that only contain sounds like [cough] [snort] [laugh] etc.
   - [ ] Try to minimize prompt classifier false rejections: `Vague prompts may fail to trigger the speech synthesis classifier, resulting in a rejected request (PROHIBITED_CONTENT) or causing the model to read your style instructions and director's notes aloud. Validate your prompts by adding a clear preamble instructing the model to synthesize speech, and explicitly label where the actual spoken transcript begins.`

See [Markdown Guide][md-guide] for details
[md-guide]: https://www.markdownguide.org/ "Comprehensive Markdown Guide"
[CmdReg]: [[CMD_REG_AND_KEYBOARD_SHORTCUT_IMPLEMENTATION#Keyboard Implementation via Command/Event Registry Model|keyboard shortcut commands]]
[promptSchema]: <https://ai.google.dev/gemini-api/docs/generate-content/speech-generation#prompting-guide> "Gemini prompting guide"
[tokenCount]: <https://ai.google.dev/gemini-api/docs/generate-content/tokens#count-tokens> "Gemini Token Counting"
[geminiTTS]: <https://ai.google.dev/gemini-api/docs/speech-generation#javascript> "generateContent / Interactions API"
[contextCaching]: <https://ai.google.dev/gemini-api/docs/generate-content/caching> "Context Caching"
<!--

EOF

-->
