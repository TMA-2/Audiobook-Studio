# TODO
<!-- markdownlint-config
no-bare-urls: true
MD013:
  line_length: 512
MD040: false
-->

**Key**
- [ ] TODO
- [/] In progress
- [x] DONE
- [-] Hold off / Pause
- [Z] Canceled / Impossible
- [o] TBD

## Rough Roadmap

### 0.13.2
- [x] Fix [[TODO#FIX THE GOD DAMN RAW CHARACTER COUNT LOGGING ALREADY|this stupid raw char/word count bug]].
- [x] Fix the chapter header `Prompt Chars`, `Prompt Words`, and `Overhead` counts. Overhead is just the difference between raw characters and formatted prompt characters though, so it should always be a positive value. Regarding what it counts: add up the selected snippets if selection, otherwise the chapter's snippets.
- [o] Fix the [[TODO#Snippet Editor|input lag issue]] in the snippet editor.
- [o] Sheets logging is overwriting the same row continuously. Not sure why, given it's not having to check the last row written and then write to that index+1, it's just using the `append` method of the API. something's up, though, because it *has* logged many times, but looking at the edit history for the last few days, it continually writes to one row, so it's... stuck or something
- [x] [[TODO#getAudioDuration error|Two constant errors]] are being caused by `getAudioDuration()`, and I have no idea why. I assume it has something to do with promise/response timing or debounce or some shit.

### 1.13.0
- [ ] Implement the new [[TODO#Project Configuration / Schema|ABS project format]]
  - [ ] This means `project.audio.json` sidecars will go away, *however* at least the loading support needs to stay so they can be opened and then saved to the new format

### 1.14.0
- [ ] Implement Gemini 3.8 Flash TTS support, which will require some workflow changes
  - [ ] See: Migration Guide [[TODO#API Features / Backend|API Changes]]
> This will require some amount of re-design of the prompt template, obviously, as well as speaker handling, prompt template design, how best to handle generations (i.e. number of speakers, longer or shorter, separating requests by mood/emotion or delivery, etc.), and more.
- [ ] Handle speakers now that they can be defined with a persistent `voice_id` to use in subsequent requests, along with short ad-hoc style instructions on top of temporal `<direction>` tags
- [ ] If the texarea can get styled with some simple syntax highlighting, "Interjections" from the other speaker using `|<line to speak>|` in the middle of a snippet should absolutely be included, e.g.: `"I really liked this movie, |Oh, yeah?| I thought it was great! |I have to disagree...|"`.
  - In my playground testing, they don't really speak *over* reach other, and the interjection was sometimes just flat ignored, but it's a cool way to insert little ad-libs and whatnot which don't require a whole separate snippet from that character just saying "Oh" or something.

## Bugs
- [ ] Sheets service should try to authenticate when the app loads. Typically it'll just pop up a login box that disappears after two seconds and that's it. Or, if there's a way to tell when the token has expired, to automatically re-authenticate (possibly opening the window such that it doesn't steal focus, like a "pop-under")

### Snippet editing lag
- [ ] Fix text editing (and UI reactivity, I think) delay. Seems to be pretty directly correlated to the number of snippets in the chapter.

> [!NOTE]
> Typing in a snippet textarea lags in proportion to the number of snippets in the chapter (~250ms at 6, ~750ms at 30, dev build; INP trace is ~85% processing duration, not paint).

#### **Claude's suggestions:**
- [ ] Keep the text in local state inside the textarea component and commit it to the project on a debounce (about 300 ms) and on blur or chapter switch. This alone fixes most typing lag.
- [ ] Memoize the snippet row and give each row a selector so it only re-renders when its own snippet changes.
- [ ] Debounce autosave, and write only the changed snippet. That matches the per-record storage you’ve been planning.
- [ ] Add `content-visibility: auto` to off-screen rows, with `contain-intrinsic-size`. It skips layout and paint for rows nobody can see, and it addresses your “rendering off-screen” hunch, though not React’s own render cost.
- [ ] Wrap the derived counts in `useDeferredValue` so typing stays higher priority than the numbers.
- [ ] Find what runs per keystroke with cost proportional to chapter/project size.
- [ ] (1) is the textarea controlled by project-level state, and does onChange clone anything deeply?
- [ ] (2) which components re-render per keystroke (add console.count to the snippet row and chapter header)?
- [ ] (3) where Chars/Words/Prompt Chars/Overhead/Txt/Sent are computed, and whether they call the prompt compiler for every snippet each render
- [ ] (4) grep for JSON.stringify, structuredClone, scrollHeight, and .filter/.map in render bodies, and effects depending on project/chapter.

### getAudioDuration error
[An error](./src/services/audioService.ts:182) pops up maybe 1/3 of the time on playback, which seems to be a false positive of some sort, as after clicking through the alert, the generation plays fine. I've commented out the alert line for now, but it needs to be fixed.

```log
08:47:53.427 audioService.ts:181 Audio playback error:
`[[Prototype]]`: Event audio.onerror @ audioService.ts:181
```

This god damn error has been plaguing it forever and I typically didn't notice because it just went to the console in AI studio

```log
Error parsing audio duration: ReferenceError: Audio is not defined
at <anonymous> (C:\Users\tma2\OneDrive\Source\audiobook-studio\src\services\audioService.ts:76:21)
at new Promise (<anonymous>)
at getAudioDuration (C:\Users\tma2\OneDrive\Source\audiobook-studio\src\services\audioService.ts:56:10)
at <anonymous> (C:\Users\tma2\OneDrive\Source\audiobook-studio\server.ts:499:33)
at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
```

### FIX THE GOD DAMN RAW CHARACTER COUNT LOGGING ALREADY
- [ ] Raw character & word count too small in logging.
- [ ] This is almost certainly a failure on my part, using `.map()` incorrectly
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
  - [ ] Test Interactions with [[TODO#Gemini 3.8]]
- [ ] Add statusbar (top or bottom, either way) to view selected chaaracters / tokens to stay under 8KB limit as well as total request data: # requests, # chars, words, tokens, audio size, duration, etc. per day. This will be read from a daily JSONL log which will write one entry per request with all the above fields. **Collect now, query later.**
- [ ] Change markdown importing style to handle scenes, further prompt notes, perhaps just using a Key: Value style under each chapter, speaker, scene, etc.
  - [ ] Run a cleaning pass on exported markdown because Docs is fucking *STUPID* how it exports markdown. it must miss a step in the chain of format shifts in and out of json and base64 and whatever other shit it passes through, because it ends up with *every* bit of punctuation escaped with a backslash. Thanks for nothing google.
  - [ ] `[\x{201C}\x{201D}]` for *FaNcY* double quotes
  - [ ] `[\x{2018}\x{2019}]` for *FaNcY* single quotes
  - [ ] `\\` for every backslash, as there's no legitimate need for them in any document that I can think of
- [x] Implement multi-speaker API calls (but to use single-speaker you have to switch and shit, fukken annoyin')
  - [x] Fix prompt template, integrating
  - [/] Test generation of multiple snippets (same instructions and text) combined, ~500b, ~2kb, 4kb, 6kb, both in sequence and using the multi-speaker request config

## Metrics
- [x] Collect: timestamp, req status, (error ID, error msg on failure), project name, # req snippets, # raw chars, # prompt chars, # raw words, # prompt words, req tokens, response tokens, audio size, audio duration
  - [x] This will use a google sheet like `AudiobookStudioLog yyyy`, perhaps with a new sheet/tab per month. I don't think per-day sheets are necessary since my usage isn't very steady, spending more time writing, or working on the app, or generating and fine-tuning, and only the latter would produce log entries of course.
- [ ] Display status on [[TODO#Statusbar|UI status bar]]: selected characters / tokens to stay under 8KB limit as well as total request data:
  - [ ] # requests, # chars, words, tokens, audio size, duration, etc. per day/hour/etc.
- [x] Add a simple function to send an API call to `countTokens`

## Architecture
- [ ] [Implement forced alignment](./NOTES/0.13.1-x.x.x-FORCED_ALIGNMENT_AUDIOSNIPPET_PLAN.md) to be able to edit audio at word-level granularity as well as being able to select a sentence and play it, or show playback progress by highlighting words as they're spoken, likely using `echogarden`.
  - **Normalize the text before the cumulative-offset walk.** echogarden will tokenize numbers, abbreviations and punctuation differently from your raw text ("Dr.", "1,200", em-dashes). Map both sides through the same normalization, or the snippet boundaries will drift.
  - **Use it to catch flubs.** echogarden can also transcribe the audio. Diff that transcript against the script and it will flag "Crying. I'm very hurt!" or a wrong name automatically, so you don't have to find them by ear. That turns the feature from "splice after you notice" into "here are the three lines to regenerate."
- [ ] Implement [[TODO#Project Configuration / Schema|new project format]]: .abs file containing roughly the same project JSON format, plus the audio generations, now in binary format, identified by ID. No more Base64, the data shouldn't have to be streamed to IndexedDB to get around the 512MB JSON limit when it's literally just binary blob to binary blob.

### Integration
- [ ] ADD THE GDAMN GDOCS API FFS AND STOP IMPORTING AND EXPORTING MARKDOWN GOT DAMN JUST GET IT DIRECTLY YOU EEL

**Claude's integration notes**
```md
1. **Doc → Studio parsing plus a one-way "Clean" tab:** easy and valuable. Ship this first. To summarize:
   1. Writing that will be done with the intention of using it in ABS will be written in a *separate* Docs tab (like "Master" or "ABS" or whatever) with inline `[directions]` (3.1) or `<directions>` (3.8) with character markers for dialogue. The best would be some manner of metadata that isn't in the actual text, but it's whatever.
   2. Importing from ABS will be very easy, obviously.
   3. There will be a separate tab (e.g. "Clean") that is synced one-way from ABS with the inline tags stripped, chapters inserted as H2 headings and so forth.
   4. Perhaps look into Google's App Script to add ABS-related cleaning / formatting functions. Perhaps even... connect it to ABS for direct communication???
2. **Studio → Doc:** generic diffing will hurt. Anchor each paragraph to its snippet with Docs API named ranges, keyed by snippet ID. Sync then becomes "replace the text in range X," with no diffing. One limit: the API can't create suggested edits, so pushed changes land as direct edits.
  - One thing that makes this better: Docs has built-in file history, so... yeah.
- **A cheaper v1:** the Doc owns the text and the Studio owns audio and speaker assignments. When a pull changes a snippet's text, mark that snippet's generation "stale". That covers most of the maddening part without any two-way sync.
  - This of course assumes the line breaks/paragraphs match... but it's whatever.
```

### IO
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
- [ ] Saving preferences separate to the project file with an option to include project-specific settings that override global -- much like workspace and folder options override user settings in VS Code

## UI / UX

### Snippet Editor
- [ ] Implement a lightweight syntax-highlighted text element, maybe `@uiw/react-textarea-code-editor` or `react-md-editor` or similar, just allowing custom highlighting and decoration of certain patterns, so long as it does *not* introduce any noticable lag in editing.
- [ ] Implement variability in UI element spacing so it can be more compact or more spaced out depending on user preference, similar to how VS Code allows for "compact" or "comfortable" UI density settings.
- [ ] **LOW PRIORITY** The site is unusable on mobile. I thought the whole idea of handing off design to React and similar was that they would, insofar as you allow them, automatically re-arrange controls so it'll be at least partially usable on small screens. However, on my Pixel 7, which has a 2400x1080 resolution, it barely shows past the sidebar.
- [x] Speaker previewing
- [x] Each snippet and chapter displays the cumulative number of characters, words, and approximate request token count.
- [x] Auto-focus currently playing snippet (add settings toggle)
- [-] (If necessary) More performant rendering, culling off-screen elements until they're within a certain range of the client area.

### Command Registry
- [ ] Implement a command registry for each discrete UI action to handle keyboard shortcuts and other commands, similar to VS Code
- [ ] Commands carry `when` clauses evaluated against context keys, such as `snippetFocused`, `generationSelected` or `isPlaying`. A small focus-tracking context sets those keys, and the palette and keybindings both read from one registry. Build it *before* any *Impeccable* redesign so the redesign can assume the palette exists.
- [ ] A context watcher that tracks which UI element is currently focused, and what the current state of the app is (e.g. snippet editor focused, settings dialogue open, etc.) to determine which commands are available at any given time.
  - [ ] Perhaps include a visualization of the current context and available commands for debugging purposes modeled after Zed's keyboard context view
- [ ] Add a *command palette* to arbitrarily invoke a [command registry entry](./NOTES/CMD_REG_AND_KEYBOARD_SHORTCUT_IMPLEMENTATION.md)

### Navigation
- [ ] A quick-navigation feature (Ctrl+G Goto Line, Ctrl+Shift+O Goto Symbol) to live-filter snippets matching a string. By default, searching like `.*term.*` unless the string contains `* | ?` and then use the exact search, replacing `*` with `.*` and `?` with `\\S`
  - [ ] Add targeted searching via properties / scopes like GitHub (basically just matching the same snippet interface property value) like `Speaker: Jane` or `Voice: Kore` or `MinLength: 20` or `MaxWords: 10` or `Generated: true` etc.
  - [ ] Include a regex option, naturally, like `/^\\w+:(?= )` to match all attributed text lines or `/\\b\[[\\w ,]+\]\\b/` to match all text with directions
- [ ] [Keyboard shortcut](./NOTES/CMD_REG_AND_KEYBOARD_SHORTCUT_IMPLEMENTATION.md) settings schema with mappable commands
  - [ ] Keyboard Settings interface
  - [ ] Keyboard command handler / shortcut mapping which will require [[TODO#Command Registry|Command Registry]] implementation

### Custom Theming
- [ ] This means: Create the color schema FIRST. Is it JSON-based? Raw CSS? Tailwind (whatever that means)? SCSS or LESS or one of those things I don't understand?
  - [ ] If CSS: Look at Atom/Pulsar's usage
- [ ] Create discrete UI element names to make theming and even UI interaction tracking *way* easier. Possibly base it on Zed? Perhaps just use CSS directly like Atom did? or SCSS/LESS? Also see: Obsidian's own theming format and the two One Dark themes I found
- [ ] This will depend on having an easy, reusable set of multiple UI scope names
- [ ] Decide on a customizable theme format with automatic dark and light defaults.
  - [ ] See how the PS Universal theme works with base colors and then secondary, gamma, and delta values. Might be a lark?
  - [ ] Theme editing / importing -- perhaps use terminalcolors repo for basic 16-color palettes to add quick variety.
  - [ ] Count up the individual UI element colors and map between UI elements in VS Code, Atom, Zed, whatever.
  - [ ] Compare VS Code UI scope names with Zed UI scope names and Atom UI scope names and Obsidian scope names and... (etc.). It shouldn't be *too* difficult to make a list. Be sure to include Markdown syntax colors for snippets, instructions, prompt editor, etc.
- [ ] This connects directly to my idea for a PowerShell module that enables conversion between any application theme. Catppuccin will be an invaluable resource for this given how many apps and sites and misc. other things they've created themes for.

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
- [ ] The speaker configuration settings will need an overhaul for Gemini 3.8, possibly even getting its own config dialogue, as persistent `voice_id`s will need to be managed.
- [ ] Add an editbox for the speaker preview text with a selection of default phonetic pangrams.
- [ ] Implement lightweight markdown syntax highlighting editor to prompt editor, speaker instructions, scene instructions, and *all* snippets assuming it's performant (likely react-md-editor or something)
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
- [ ] A progress indicator w/ *approximate* **time** left on generation, based on the above data.
- [ ] Estimated full audio length & file size based on the selected format, total size of generations, and estimated size of snippets without generations.
- [ ] Cumulative tokens used for the project (perhaps saved in the project file), possibly with a price estimate or whatever.

### Project Configuration / Schema
- [ ] Create new .abs format and start using it.
- [ ] Actually write the god damn schema for the project json.

**MyAudiobook.abs**: zip archive using using compression *if* the generation contents are l16 or WAV, otherwise it should be set to `store` (i.e. no compression)
- **project.json**: essentially the same as the current project format, except for the chapters.content.generations references.
- **generations/**: a folder containing the generated audio data binaries, named by their unique ID, in whatever format they were generated in (L16, WAV, FLAC, etc.)
  - **f48c0687-8915-4b47-85bc-7e89850d23a3.mp3**: Audio file with the generation ID as its name. Multiple snippets may reference it, using start/end offsets once forced alignment is added

#### project.json Example

> [!INFO]
> Schema TBC

```json
{
  "projectName": "Big Tiddy Goth Lesbians",
  // existing project.json + project.audio.json will be considered version 3
  "schemaVersion": 4,
  "settings": {
    "model": {
      "id": "gemini-3.1-flash-tts-preview",
      "name": "Gemini 3.1 Flash TTS (Preview)",
      "description": "Primary high-quality TTS model"
    },
    "temperature": 1.2,
    "encoding": "M4A",
    "sampleRate": 24000,
    "promptTemplate": "# {project_title}\n## {chapter_title}\n\n## Speakers\n\n### {speaker_name}\n- Role: {speaker_role}\n- Voice: {speaker_voice}\n- Style: {speaker_instructions}\n\n## Scene Context: {scene_name}\n{scene_context}\n\n## TRANSCRIPT\n{snippet_text}",
    "generationOption": "combined"
  },
  "speakers": [
    {
      "id": "01a0adad-e9bc-7d72-b5d2-3b2e58c534f9",
      "order": 0,
      "name": "Evangeline",
      "voice": "Kore",
      "instructions": "You're a Big Tiddy Goth/Punk Lesbian GF. You have a love/hate relationship with Tiffani. Affected, deep, 'so over it' voice with a dollop of vocal fry.",
      "isNarrator": true
    },
    {
      "id": "01a0b1f3-5998-7313-8cff-72836b7524e7",
      "order": 1,
      "name": "Tiffani",
      "voice": "Aoede",
      "instructions": "You're a Catty Mean Girl Prep, queen bee, and closeted lesbian. You have a love/hate relationship with Evangeline. Valley girl accent, spelling out acronyms like OMG and LOL instead of just saying or doing the thing, constantly saying 'that <noun> is *so* <adjective>'.",
      "isNarrator": false
    }
  ],
  "scenes": [
    {
      "id": "01a0adab-02b0-7292-8727-da86dc535627",
      "name": "A Gothic Mansion",
      "description": "Big scary old mansion. Inside, a bad girl goth lesbian and her closested preppy mean girl classmate have been sent inside on a dare. The sexual tension between them is palpable, with the goth's dark allure contrasting sharply against the mean girl's energetic, sarcastic, yet anxious demeanor. Their hearts are pounding, and not just from the creepy surroundings.",
      "order": 0
    }
  ],
  "chapters": [
    {
      "id": "c1d2e3f4-5678-90ab-cdef-1234567890ab",
      "name": "Chapter 1",
      "order": 0,
      "globalSpeaker": "01a0adad-e9bc-7d72-b5d2-3b2e58c534f9",
      "collapsed": false,
      "content": [
        {
          "id": "7ca2642b-6615-4f86-956e-ef2a523a0f85",
          "speaker": null,
          "sceneId": "01a0adab-02b0-7292-8727-da86dc535627",
          "order": 0,
          "collapsed": false,
          "text": [
            "It was a dark and stormy night."
          ],
          "activeGenerationId": "f48c0687-8915-4b47-85bc-7e89850d23a3",
          "generations": [
            {
              "id": "f48c0687-8915-4b47-85bc-7e89850d23a3",
              "snippetId": "7ca2642b-6615-4f86-956e-ef2a523a0f85",
              "speakerId": "01a0adad-e9bc-7d72-b5d2-3b2e58c534f9",
              "timestamp": "2026-09-18T16:26:28.796Z",
              "model": "gemini-3.1-flash-tts-preview",
              "temperature": 1.2,
              // forced alignment will make the start/end properties possible, unless the generations are split into one file per snippet...
              "timeStart": 0,
              "timeEnd": 11569,
              "binStart": 0,
              "binEnd": 123200,
              "text": "It was a dark and stormy night.",
              "audioMimeType": "audio/mp3; rate=24000; channels=1",
              "duration": 46.8,
              "hash": "sha1 or md5 hash of the binary"
            }
          ],
        },
        {
          "id": "66647e2d-fb6f-41d4-89db-d7add2aa9835",
          "speaker": "01a0b1f3-5998-7313-8cff-72836b7524e7",
          "sceneId": "01a0adab-02b0-7292-8727-da86dc535627",
          "order": 1,
          "collapsed": false,
          "text": [
            "OMG that's like, so mid, LOL. [gasp] Eva, what's that? I'm gonna hold onto you for protection! A-And don't get any ideas, you dirty dyke, it's j-just because I'm scared, okay?! I don't like, w-want you to... like, k-kiss me or uhm, e-eat me... Hah, as if!"
          ],
          "activeGenerationId": "f48c0687-8915-4b47-85bc-7e89850d23a3",
          "generations": [
            {
              "id": "f48c0687-8915-4b47-85bc-7e89850d23a3",
              "snippetId": "66647e2d-fb6f-41d4-89db-d7add2aa9835",
              "speakerId": "01a0b1f3-5998-7313-8cff-72836b7524e7",
              "timestamp": "2026-09-18T16:26:28.796Z",
              "model": "gemini-3.1-flash-tts-preview",
              "temperature": 1.5,
              "timeStart": 11570, // milliseconds
              "timeEnd": 46792,
              "binStart": 123201, // bytes
              "binEnd": 561378,
              "text": "OMG that's like, so mid, LOL. [gasp] Eva, what's that? I'm gonna hold onto you for protection! A-And don't get any ideas, you dirty dyke, it's j-just because I'm scared, okay?! I don't like, w-want you to... like, k-kiss me or uhm, e-eat me... Hah, as if!",
              "audioMimeType": "audio/l16; rate=24000; channels=1",
              "duration": 46.8,
              "hash": "sha1/md5 checksum"
            }
          ]
        }
      ]
    }
  ]
}
```

#### Claude's implementation notes
- **ABS format:** A zip archive with manifest and media files. This is how other formats work, including docx, epub, and kra. You only pay the conversion cost because IndexedDB currently holds base64 strings, and it doesn't need to: IndexedDB stores `Blob`s and `ArrayBuffer`s natively. If you store raw PCM there, save becomes "wrap in a WAV header and write to the zip" with no conversion anywhere. That's probably the biggest win in the whole idea.
- **Keep the working audio lossless.** Gemini TTS output is 24 kHz 16-bit mono, which is about 2.8 MB per minute, or roughly 1.7 GB for a 10-hour book as WAV. Deflate barely shrinks PCM, so write the WAVs with zip STORE: saving is faster and you can read single entries without decompressing. If size becomes a problem, FLAC halves speech losslessly and has WASM encoders. Use AAC or Opus only for the final m4b export. Splicing lossy intermediates degrades the audio each time you regenerate a line.
- **Use fflate over JSZip.** It streams, and at multi-GB sizes you can't build the zip in memory. Your Express server could also write it straight to disk.
- **The JSON is the source of truth for metadata.** WAV `LIST/INFO` chunks (`INAM`, `IART`, `ICMT`, `IPRD`) will show project, chapter and snippet info in Explorer and other tools. Treat them as a convenience copy, not something the app reads back.
- **It fits the alignment plan.** Generation WAVs stay immutable, keyed by ID. `AudioSnippet` offsets and any splice or patch list live in the manifest. That gives you a non-destructive edit list, which is what you want when you regenerate one line inside a good take.
- **Two small extras:** put a format version in the manifest from day one, and consider EPUB's trick of making an uncompressed `mimetype` file the first zip entry, so the file type can be sniffed.

## API Features / Backend
- [x] Add a "temperature" setting.
- [ ] Look into creating a UI focus... watcher? Service? to make [[CMD_REG_AND_KEYBOARD_SHORTCUT_IMPLEMENTATION#Keyboard Implementation via Command/Event Registry Model|keyboard shortcut commands]] and general event handling easier (possibly), again with VSCode-like "when" context scopes like textEditorActive + settingsDialogueActive + speakerSettingsActive + speakerInstructionFocused. This would rely on the [Command Registry](#command-registry) though
- [ ] **LOW** the interface should have an enum property for access/mode, like 'user', 'debug', 'dev', 'admin' and each command in the registry is made available when the palette is invoked, along with connected keyboard shortcuts, and UI button actions.
  - e.g. on condition that `currentMode >= <command>.mode`, i.e. a command for "clear indexed db cache" might have a 'debug' level with a value of 1, and our currentMode == 'dev' (2), so 2 >= 1 and it shows up.
- [ ] If this is ever hosted somewhere public, accepting a Gemini API key or else authentication with a Google account with Gemini / Cloud access
  - [ ] Also displaying its current quota. Or even just displaying my *own* quota lol.
- [ ] An API endpoint to use the asynchronous audio generation in order to start and stop previewing without having to generate the full text.
- [ ] Implement [Batch API][batchapi] for generating full projects or chapters (i.e. > 10 parallel requests)
- [ ] Implement [streaming API][streamingGenApi] ([Interactions API version][streamingIntApi]) to test how well it works vs. synchronous, or if the drift is any different, esp. using podcast-like multi-speaker mode.

### Gemini 3.8 Implementation
- [x] gemini-3.8-flash-tts added to types
- [x] gemini-3.8-flash-lite-tts added to types

> [!NOTE]
> Implementing this will require some hopefully minor changes to a few things.

- [ ] Speaker settings will need to generate and save `voice_id` with the associated API request + optional previewing of the voice, and allowing for saving them in global preferences which aren't a feature yet; settings are currently saved to the project file.
- [ ] A new `VoiceProfile` interface (whether a tab in Settings or otherwise) will need to be created, which a `Speaker` can then reference *instead of* other properties like instructions, voice, pace, whatever else. But it isn't required: Gemini 3.8 can still use ad-hoc speaker directions iirc.
  - [ ] This would handle API calls to search the "hundreds" of pre-made voices (basically the core 30 + preset directions) as well as the user's own, which probably don't need to be saved locally since I believe according to the documentation are saved to the project for a length of time, 100 days or something to that effect, and if it returns a creation time, a like "days remaining" value could be displayed, normalized to 0-1, colored with a gradient going from green -> yellow -> red.
  - To wit: A Speaker isn't a TTS thing, it's more akin to an abstract "Character" in the book. it isn't a TTS voice unto itself, it's a character *using* a TTS voice.
- [ ] implementing global settings, possibly save server-side with... I don't know, don't need a login when I'm the only one using it, so... I mean hell, a local JSON file or some shit would be fine. or just use your google login SSO-style if that's easy enough, saving to Drive (although when doing that, it isn't user editable which bugs me...)
- [x] Interactions API (already sitting there as an option, not working for 3.1 because google is fucky I guess)
  - [ ] Some updates will be needed however to verify that the properties Gemini 3.8 uses are handled properly when creating the request.

#### Gemini 3.1 -> 3.8 Migration guide

If you are migrating from `gemini-3.1-flash-tts-preview` or earlier Gemini TTS models, update your requests for the Gemini 3.8 TTS schema:

1. **Move turn-level directions into `speech_metadata`:** Gemini 3.8 TTS treats input text strictly as a verbatim transcript. Inline text directions like `"Say cheerfully: Hello!"` or `"Speaker 1: Hello!"` may be spoken aloud. Move sustained delivery instructions (`style`) and speaker labels (`speaker`) into structured metadata:
   - **Interactions API:** Attach an annotation with `"type": "speech_metadata"`, `"speaker"`, and `"style"` to each text content block.
   - **GenerateContent API:** Attach `"speech_metadata": {"speaker": "...", "style": "..."}` to each `part`.
2. **Use angle-bracket inline tags only for point-in-time vocal events:** Keep momentary non-speech vocalizations and pauses inline in the transcript using angle brackets (such as `<laugh>`, `<sigh>`, `<cough>`, `<breath>`, or `<short pause>`). Put delivery styles like whispering in `speech_metadata.style`.
3. **Specify `speaker` on every turn in multi-speaker requests:** Every turn in a multi-speaker request must explicitly include `speaker` inside `speech_metadata` matching one of the configured speakers.
4. **Design personas upfront with Voice design:** Replace long legacy Audio Profile / Director's Notes blocks with a custom voice created in [Voice design][gemini38voicedesign], then carry that `voice_...` ID through your TTS requests with minimal or empty `style` strings.
5. **Account for default WAV (`audio/wav`) output on unary requests:** Unlike `gemini-3.1-flash-tts-preview` and earlier TTS models (which returned headerless raw PCM `audio/l16` by default), Gemini 3.8 TTS returns WAV audio (`audio/wav` / `AUDIO_WAV`) with a standard RIFF header by default for unary requests.
   - If your code previously wrapped raw PCM bytes in a WAV header (for example, using Python's `wave` module or `ffmpeg`), remove the manual header wrapper and write the returned bytes directly to a `.wav` file.
   - If your pipeline requires headerless raw PCM, mu-law, or A-law audio, explicitly set `response_format.mime_type` to `"audio/l16"`, `"audio/mulaw"`, or `"audio/alaw"` (for example, `{"response_format": {"type": "audio", "mime_type": "audio/l16"}}` in the Interactions API, or `AUDIO_L16`, `AUDIO_MULAW`, or `AUDIO_ALAW` in `generateContent`). See [Audio output formats][outputformats].

#### When to use which TTS model according to Google's marketing bullshit

> [!attention]
> Takeaway: Just use Gemini 3.8 Flash TTS for everything.

**Gemini 3.8 Flash TTS Strengths**
- ✔️ Maximum voice fidelity
- ✔️ acting nuance / heavy vocal-burst acting (obv)
- ✔️ regional dialects and coverage (at least for Dani's Irish brogue in The Roommate Trap, otherwise don't really care)
- ✔️ Audiobooks (obv)
- ✔️ studio narration (obv)
- ❔ difficult pronunciation (define "difficult")
- ❔ complex multi-speaker dialogue (like... with interjections and cross-talk and whatever? it still only allows up to 2 speakers per request, so...)

**Gemini 3.8 Flash-Lite TTS Strengths**
- ❔ cost efficiency (maybe... we'll see.)
- ✖️ High-volume production (what that is ??????????//)
- ✖️ low latency (for... response times? request times? streaming requests? either way likely doesn't matter for audiobooks)
- ✖️ real-time voice agent cascades (not sure what a cascade is, but pretty sure "voice agent" is some phone-tree, "Ask our AI chatbot for help!" button-in-the-website-corner enterprise garbage)
- ✖️ read-aloud features (what this means ??????????????? can't all TTS models "read aloud"?)
- voice replication (not really? maybe Peri Gilpin for the Frasier fanfic, or Totsuka for the OreGairu fanfic, but then I'd have to translate it to JAPANESE AND THERE'S NO GOD DAMN WAY. also I don't even know if that would be legal????????????????????????????)
- everyday single-speaker generation (...ok)

#### Code Examples - Interactions

**Single-Speaker**
```ts
import {GoogleGenAI} from '@google/genai';
import * as fs from 'node:fs';

async function main() {
   const client = new GoogleGenAI({});

   const interaction = await client.interactions.create({
      model: 'gemini-3.8-flash-tts',
      input: [{
         type: 'user_input',
         content: [{
            type: 'text',
            text: 'Have a wonderful day!',
            annotations: [{
               type: 'speech_metadata',
               style: 'cheerful and friendly',
            }],
         }],
      }],
      response_format: { type: 'audio' },
      generation_config: {
         speech_config: [
            { voice: 'Kore' },
         ],
      },
   });

  // interaction.output_audio.data
  // -> base64-encoded WAV audio
}
await main();
```

**Multi-Speaker**
```ts
import {GoogleGenAI} from '@google/genai';
import * as fs from 'node:fs';

async function main() {
   const client = new GoogleGenAI({});

   const interaction = await client.interactions.create({
      model: 'gemini-3.8-flash-tts',
      input: [{
         type: 'user_input',
         content: [
            {
               type: 'text',
               text: "How's it going today Jane?",
               annotations: [{
                  type: 'speech_metadata',
                  speaker: 'Joe',
                  style: 'cheerful and friendly',
               }],
            },
            {
               type: 'text',
               text: 'Not too bad, how about you? Ready to test these new voices?',
               annotations: [{
                  type: 'speech_metadata',
                  speaker: 'Jane',
                  style: 'calm and relaxed',
               }],
            },
         ],
      }],
      response_format: { type: 'audio' },
      generation_config: {
         speech_config: {
            speakers: [
               { speaker: 'Joe', voice: 'Puck' },
               { speaker: 'Jane', voice: 'Kore' },
            ],
         },
      },
   });

  // interaction.output_audio.data
  // -> base64-encoded WAV audio
}
await main();
```

## Gemini API Handling (i.e. shit you have to infer and run tests on to deteremine how it *actually* works)
- [x] Migrating to multi-speaker audio generation template which is largely the same, except you define an array of speakers (up to 2 currently) and tag them in the script. This will enable generating multiple contiguous snippets at once so long as it doesn't use more than 2 speakers and the total amount of text doesn't exceed 8KB.
- [ ] See [Gemini TTS prompting guide][promptSchema] for detailed info.
- [x] Parallel generation requests... assuming that's possible with the same key.
  - [x] Determine how many parallel requests can be made (10) before a hard limit, or before it gets laggy, etc.
  - [Z] According to the Gemini model docs, implicit [context caching][contextcaching] happens when requests are made closer together, so that's good. *Only for text models!* Currently, each snippet is generated independently, i.e. one snippet : one API call. So, there may be voice drift if the speaker instructions are too general or generated far apart; implicit context caching kicks in when requests are made with the same instructions close together in time.
- [ ] Try to minimize prompt classifier false rejections: `Vague prompts may fail to trigger the speech synthesis classifier, resulting in a rejected request (PROHIBITED_CONTENT) or causing the model to read your style instructions and director's notes aloud. Validate your prompts by adding a clear preamble instructing the model to synthesize speech, and explicitly label where the actual spoken transcript begins.`
  - [ ] Flagging snippets when they likely won't generate -- the Vertex API or Gemini models *really* do not like snippets under a certain length, that only contain sounds like [cough] [snort] [laugh] etc., or certain words together like "young girl", anything that even *vaguely* indicates CSAM which it's over-zealous about. and in my experience, these tend to get rejected with Reason: "Other" which is *really* fucking annoying, like just say "Safety" ffs.
  - [ ] It doesn't account for context imo, like: "At 25, Stacy could be considered a young girl relative to her 41-year-old girlfriend Kate." would likely get rejected, so I often replace "girl" with "lady" or "woman" which is ridiculous. "Child" or "Teen" or ages < 18 I could understand, but if "girl" indicates youth more than "woman," then "young girl" is redundant anyway.
  - [ ] Through logging requests that come back with a rejection or error, analysis could be done on the content to find most-used words and to try to build some correlation to predict what the API is going to reject even with safety settings turned off, and this could then be used to provide a warning on snippets containing these word combinations along with suggestions on how to change them, perhaps even fixed automatically when pressing a button, kind of like Code Actions.

## Refs

[CmdReg]: file://NOTES/CMD_REG_AND_KEYBOARD_SHORTCUT_IMPLEMENTATION.md
<!--#Keyboard Implementation via Command/Event Registry Model-->

[tokenCount]: https://ai.google.dev/gemini-api/docs/tokens#javascript "Gemini Token Counting"
[geminiTTS]: https://ai.google.dev/gemini-api/docs/speech-generation#javascript "Interactions API"
[contextcaching]: https://ai.google.dev/gemini-api/docs/generate-content/caching "Context Caching in generateContent API"
[promptSchema]: https://ai.google.dev/gemini-api/docs/generate-content/speech-generation#prompting-guide "Gemini prompting guide for generateContent API"
[promptSchemaInteractions]: https://ai.google.dev/gemini-api/docs/speech-generation#prompting-guide "Gemini prompting guide for Interactions API"
[batchapi]: https://ai.google.dev/gemini-api/docs/batch-api#javascript_1 "Gemini Batch Request API"
[streamingGenApi]: https://ai.google.dev/gemini-api/docs/generate-content/speech-generation#streaming "TTS Streaming generateContent API"
[streamingIntApi]: https://ai.google.dev/gemini-api/docs/speech-generation#streaming "TTS Streaming Interactions API"
[gemini38voicedesign]: https://ai.google.dev/gemini-api/docs/voice-design "Voice Design in Gemini 3.8 Flash TTS"
[outputformats]: https://ai.google.dev/gemini-api/docs/speech-generation#audio-output-formats "Gemini TTS Audio Encoding"
