# Audiobook Studio

<img width="1975" height="1508" alt="image" src="https://github.com/user-attachments/assets/f2caf775-a5f7-4184-a69b-f1455c75365c" />

## Synopsis
**Take your story and give it a _voice_. Literally.**

## Description
This is an application that utilizes the advanced multimodal Gemini TTS models to produce narrated audio files per-line, per-paragraph, per-chapter, or whatever granularity you like, using a single narrator, five different characters, or any combination you wish, each one configured using a Gemini model and voice and natural language instructions.

## Workflow
1. Currently, it only accepts plain text and markdown files as input, which it parses into chapters by H2 heading and discrete blocks of text ("snippets") by paragraph / line break, as well as a section to pre-define your characters. You can just use it to write an audiobook or other voice performance from scratch if you like, though.
   - By default, the first character noted with `- Narrator: Yes` is defaulted to for all parsed chapters and snippets. Each chapter may have one default narrator which the snippets within will default to unless otherwise specified by prepending them with `Character Name: ` matching a speaker's exact name.
2. Generate the speech per snippet, per chapter, or the full project, each of which will just make sequential API calls for each chapter and snippet therein.
3. Compare takes by clicking 'Generate' again after editing the snippet or speaker. Each take will show up at the top of the sidebar under the 'Generations' heading, which you can switch between for the focused snippet, or play each to compare, then delete the ones you won't use. Each take captures the snippet text, so when you switch takes, it will also restore the text to what it was when generated.
4. Listen to each snippet or chapter as you like until it's satisfactory.
5. The audio file can be exported to disk for the full project, or per chapter, or per snippet.
   - Currently only 16-bit mono PCM @ 24KHz is supported.

Between sessions, the project data (text, chapter and snippet layout, speaker assignment, generated audio, etc.) is cached in the browser, and will auto-save periodically (you can see the Save button flash green when it does).

Then, you can save the project file to disk, along with any generated audio in a "sidecar" file with the following naming formats:
- `Book_Title.absproject.json`
- `Book_Title.absproject.audio.json`

You can then re-load this data with the controls at the top.

> [!WARNING]
> Currently, exporting the project file will not also export the audio, so remember to save both. This will be changed in the next release.
> Also, the audio is stored in IndexedDb and will persist for a while, unless and until you clear your browser cache.

## Example
The below example would produce the project seen in the screenshot above.

```md
# The Great American Novel

## Characters

### Narrator
- Voice: Charon
- Narrator: Yes
- Instructions: You are a deep-voiced, resonant, and expressive narrator of classic literature. You describe the events, actions, internal thoughts of characters, and everything else from a far-third person perspective. Your voice pitch is roughly around <X Hz> or <NoteOctave>. On average you speak at a rate of <Y wpm>, paying close attention to any [direction] tags in the text.

### Character A
- Voice: Kore
- Instructions: You're a regular guy who speaks like (...)

## Chapter 1

[slow and spooky] It was a dark, stormy night, [pause] [fast] just the type of setting you would expect for a novel with only generic filler text and meta-referential lines as examples. [dramatically] Suddenly, Character A entered the room.

Character A: [with grandeur] "Yes, it is I, the *utterly* unique and singular Character A!" [laugh]

He announced his presence with grandeur as was directed in his line! Wow, this guy was really full of himself!
```

## Planned Features

- [x] Each snippet and chapter displays the cumulative number of characters, words, and approximate request token count.
- [x] Speaker previewing
- [x] Full-chapter and project audio export
- [ ] Flagging snippets when they likely won't generate -- the Vertex API or Gemini models *really* do not like snippets under a certain length, or that only contain sounds like [cough] [snort] [laugh] etc.
   - [ ] This will require research to determine what variables go into the API/model rejecting a prompt.
- [ ] A statusbar with project stats and status messages, including:
   - [ ] A more accurate token count that takes the full prompt with instructions into account
   - [ ] Current cached audio size
   - [ ] Estimated time required to generate the audio for the full project
   - [ ] Estimated full audio file size based on the selected format
   - [ ] Telemetry-like info such as cumulative tokens used for the project, possibly with a price estimate
- [ ] Single load / save project that automatically loads the audio sidecar file (if it exists), and if it doesn't, will show a modal dialogue of some sort warning about this, as well as a small button somewhere to load an audio sidecar file.
- [ ] A full preferences dialogue to make room on the sidebar for only speakers and audio takes, as well as saving preferences separate to the project file.
- [ ] Export audio encoding, primarily M4B/AAC, with...
   - [ ] M4A
   - [ ] MP3
   - [ ] FLAC
   - [ ] OGG Opus and/or Vorbis
   - [ ] Perhaps two separate settings: container and codec, rejecting unsupported combinations and defaulting.
- [ ] A re-mappable keyboard shortcut navigation handler.
- [ ] A customizable theme format with automatic dark and light defaults.
- [ ] An option for sticky chapter headings.
- [ ] A quick navigation feature to focus a snippet matching a text string
- [ ] If this is ever hosted somewhere public, accepting a Gemini API key or else authentication with a Google account with Gemini / Cloud access, checking to see if it has access to the Gemini TTS voices and even displaying its current quota or whatever. Or even just displaying my *own* quota lol.
- [ ] Parallel generation requests... assuming that's possible with the same key. I'll have to look into that.
- [ ] An API endpoint to use the asynchronous audio generation in order to start and stop previewing without having to generate the full text.
- [ ] Integrating the multi-speaker audio generation API endpoint to see if it works better for generating full chapters (within the API limits) as each character can be separately defined, so the snippet text could be joined into a single script with speaker attribution, and the speakers used as the ... well, speakers used. This could be *VERY* good for full-chapter or at least multi-snippet generation to prevent drift.
- [ ] More performant rendering, culling off-screen elements until they're within a certain range of the client area.
- [ ] A *very* rough time-to-generate estimate for each snippet, chapter, and full project.
   - [ ] I'm currently collecting data to *very roughly* estimate the average time it takes to make an API request per-character, word, or token.
- [ ] A progress indicator w/ *approximate* time left on generation, based on the above data.
- [ ] Currently, each snippet is generated independently, i.e. one snippet : one API call. So, there may be voice drift if the speaker instructions are too general.
- [ ] I'm considering implementing a way to generate multiple snippets with a single API call using Gemini's multi-speaker endpoint which would result in far less voice drift.
The Agent Platform API **limit** for single-speaker API requests is **8kb** of text (speaker instructions + text), and the response audio duration is **10m55s**. It may be different for the multi-speaker endpoint.

## Notes

This app was mostly vibe-coded in **Google Cloud Enterprise Agent Platform** app builder before migrating it to the vastly superior **AI Studio**.

A ton of manual assistance was needed to fine-tune it and get little fiddly API quirks figured out, reading docs about the Cloud Agent Platform and authentication, Gemini TTS models, the Google Cloud TTS API, the Google Cloud Enterprise Agent Platform (fka Vertex) API (currently used), AI Studio, and the node.js libraries for all of the API calls and voice configuration parameters and limits.

> [!INFO]
> A **major credit** is owed to ✨[Audiobook-Studio.com](https://audiobook-studio.com) which I used as inspiration for the design. It has a very similar workflow and overall layout, but has a BYOK system which accepts ElevenLabs, OpenAI, and Google Cloud voices, e.g. Chirp3-HD, Wavenet, Studio, etc., but not Gemini, which is why I sought to create my own.
> I emailed them to see if it had an issue tracker, repo, etc. and it currently does not. It's a single developer side-project in beta, only worked on when time allows. It can render to an ACX-ready format for $20.
> I used the general chapter/snippet idea, as well as the minimalist layout and configuration sidebar. Everything else is "my" own work (with practically all the coding done by Gemini 3.5 Flash because I'm a PowerShell guy, not a full-stack guy). Although I suppose it *could* be built using PowerShell and PODE or PSU... (definitely not happening).

## Technical Details

This uses Node and React with the primary application in App.tsx running on a Vite web server to route API endpoints as needed. That's as much as I understand about it.

The project data is stored as JSON in LocalStorage. This is the same data exported when clicking 'Save Project'. A schema is forthcoming.
The audio data is stored in IndexedDb as base64 strings consisting of the binary data for the PCM audio.

Token count is approximated *very* roughly with char count / 4. From data collected, though, that's a decent enough approximation.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env](.env) to your Gemini API key
3. To use the Vertex API instead, set `USE_VERTEX_AI="true"` along with your GCP region, project ID, and service account key in .env. And do all the other IAM / PAM, Role, Billing, Project, Security, API key, OAuth, etc. setup in Cloud. Good luck, you'll need it.
4. Run the app:
   `npm run dev`
