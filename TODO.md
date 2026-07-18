# TODO

## General
- [x] Create Readme, Changelog, Todo, and agent instructions

## UI / UX
- [x] Speaker previewing
- [x] Each snippet and chapter displays the cumulative number of characters, words, and approximate request token count.
- [-] (If necessary) More performant rendering, culling off-screen elements until they're within a certain range of the client area.

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

- [ ] Theme editing / importing -- perhaps use terminalcolors repo
- [ ] A quick-navigation feature to live-filter snippets matching a string, with suppport for different properties like `Speaker: Jane` or `Voice: Kore` or `MinLength: 20` or `MaxWords: 10` or `Generated: true` etc. i.e. typing into a box and running a real-time fuzzy search on all snippets or only the current chapter. Include a regex option, naturally, like `/^\\w+:(?= )` to match all attributed text lines or `/\\b\[[\\w ,]+\]\\b/` to match all text with directions
- [x] A checkbox or other method of marking multiple snippets (only within the same chapter) for generation, speaker assignment, scene assignment, deletion, movement to other chapters, etc.
  - [ ] Generation button for multiple snippets only activates so long as <= 2 speakers total selected and <= *8KB* of total prompt, adding in speaker instructions, scene description, context, etc.
- [ ] Support building different "scenes", similar to speakers, with their own instructions, which can then be assigned to one or more snippets (ideally contiguous) to be generated at the same time within limits (8KB full prompt, 10m55s exported audio)

### Statusbar with stats and status messages, 
- [ ] A more accurate token count that takes the full prompt with instructions into account using the [`countTokens()` method][tokenCount]
- [ ] Current cached audio size ... maybe look into [context caching][contextCaching] as well
- [ ] A *very* rough time-to-generate estimate for each snippet, chapter, and full project. (32t / sec?)
  - [ ] I'm currently collecting data to *very roughly* estimate the average time it takes to make an API request per-character, word, or token.
- [ ] A progress indicator w/ *approximate* time left on generation, based on the above data.
- [ ] Estimated full audio length & file size based on the selected format, total size of generations, and estimated size of snippets without generations.
- [ ] Cumulative tokens used for the project (perhaps saved in the project file), possibly with a price estimate or whatever.

### Project Configuration
- [ ] Keyboard shortcut settings schema with mappable commands
  - [ ] Keyboard Settings interface
  - [ ] Keyboard command handler / shortcut mapping 
- [ ] A customizable theme format with automatic dark and light defaults.
  - [ ] Theme Settings interface
  - [ ] A schema of textmate-like UI scopes similar to VS Code themes... or perhaps just use CSS directly like Atom did? or SCSS? or LESS? whatever the difference is...

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
- [ ] Saving preferences separate to the project file with an option to include project-specific settings that override global -- much like workspace and folder options over rideuser settings in VS Code

## API Features
- [ ] Add a "temperature" setting.
- [ ] Look into the new ["Interactions"][geminiTTS] API
- [ ] If this is ever hosted somewhere public, accepting a Gemini API key or else authentication with a Google account with Gemini / Cloud access, checking to see if it has access to the Gemini TTS voices and even displaying its current quota or whatever. Or even just displaying my *own* quota lol.
- [ ] An API endpoint to use the asynchronous audio generation in order to start and stop previewing without having to generate the full text.

## API Handling (Undocumented shit you have to infer and run tests on to deteremine how it works)
- [ ] Parallel generation requests... assuming that's possible with the same key.
  - [ ] Determine how many parallel requests can be made before a hard limit, or before it gets laggy, etc. According to the Gemini model docs, implicit [context caching][contextCaching] happens when requests are made closer together, so that's good.
- [ ] Migrating to multi-speaker audio generation template which is largely the same, except you define an array of speakers (up to 2 currently) and tag them in the script. This will enable generating multiple contiguous snippets at once so long as it doesn't use more than 2 speakers and the total amount of text doesn't exceed 8KB. See [Gemini TTS prompting guide][promoptSchema] for detailed info.
  - [ ] Currently, each snippet is generated independently, i.e. one snippet : one API call. So, there may be voice drift if the speaker instructions are too general or generated far apart; implicit context caching kicks in when requests are made with the same instructions close together in time.
- [ ] Flagging snippets when they likely won't generate -- the Vertex API or Gemini models *really* do not like snippets under a certain length, or that only contain sounds like [cough] [snort] [laugh] etc.
   - [ ] Try to minimize prompt classifier false rejections: `Vague prompts may fail to trigger the speech synthesis classifier, resulting in a rejected request (PROHIBITED_CONTENT) or causing the model to read your style instructions and director's notes aloud. Validate your prompts by adding a clear preamble instructing the model to synthesize speech, and explicitly label where the actual spoken transcript begins.`


[promptSchema]: https://ai.google.dev/gemini-api/docs/speech-generation#prompt-structure "Gemini prompting guide"
[tokenCount]: https://ai.google.dev/gemini-api/docs/tokens "Gemini Token Counting"
[geminiTTS]: https://ai.google.dev/gemini-api/docs/speech-generation#javascript "generateContent / Interactions API"
[contextCaching]: https://ai.google.dev/gemini-api/docs/generate-content/caching "Context Caching"
<!--

EOF

-->