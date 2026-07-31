---
trigger: always_on
---
# Gemini Agent Instructions

## Code Preferences

> This is definitely not comprehensive, and I don't know what ESlint / Typescript / Dependency practices should go in, so this is a best guess coming from a PowerShell guy who is very much *not* a fullstack web guy, so I will likely use a lot of incorrect terminology -- just make a best effort to translate it into ECMAscript / web / etc.

- **Use Stroustrup brace style** where possible. Same as 1TBS, except that it has newlines after closing braces.
- Add basic *JSDoc* descriptions to **every** function, endpoint, method, etc. i.e. anything that performs I/O. The overal purpose/description **MUST** be documented along with a brief description of each parameter. Anything related to types doesn't really matter since the Typescript LSP will provide that in Intellisense.
- Dictionary/collection arrays with <= five items should be formatted with one key:value per line so long as they're all under 120 chars. If they're longer, it's fine to keep them on one line. But this isn't that important either, since I can always format it differently if need be.
- I still don't know enough typescript to have opinions about style though.

## General

- Don't over-engineer.
- Don't over-engineer.
- Use TDD. We'll discuss which testing framework is the most applicable as the only one I've used is Pester.
- Don't use qualitative / subjective adjectives and value judgements like "elegant", "beautiful", etc. Stick to the facts of what's being done. Relative descriptors like "more efficient/performant", "faster", "smaller", "less brittle", etc. is perfectly fine when compared to a previous state
- Don't write functions, interfaces, classes, elements, etc. that have not been discussed and are not directly related to the functioning of something we're currently adding, changing, or fixing.
- Similar to #4, don't write unnecessary code or functions that don't relate to some change we've talked about making, esp. "workarounds" and "fallbacks" for errors. If an error is happening and we're trying to fix it, I'm not likely to use a workaround or fallback -- if I do, though, I'll explicitly say we should create it.
- If I click an "auto-fix" button, i.e. you receive a templated prompt like "Fix the below errors" followed by a big block of exceptions and traceroutes, first tell me what you're planning on doing to fix it *before* implementation.

## Order of Operations

### New features, changes, everything but corrections and bugfixes

1. I send a prompt requesting a new feature, change request, or bug fix.
2. You analyze it, come up with a plan, and document it before responding.
3. For each feature / major change (not counting security and bug fixes), there should *always* be an overarching plan document first. If we create a plan, *especially* one with multiple steps / stages, verify:
  a. it's outlined in `./NOTES/<start_version>-x.x.x-<PLAN_NAME>.md` where `<start_version>` is the current version, `x.x.x` is the version when finished to fill in later. This is so we have a persistent context window between us (plus the changelog) without having to rely on either of our volatile working memories.
4. Respond with the plan outline and I'll either give the go-ahead for each step, or modify it, or ask questions, or whatever and re-convene until we have a definite action item.
5. *FIRST* write a test for what will be added (TDD): given feature X, what shape does its input Y take, and what is the expected output Z? This will surely involve mocking API endpoints and user interactions and whatnot. I *imagine* this should be easy given server.ts, but I could be wrong.
  - Aside: This is something I'd like to start following with PowerShell and Pester, so interacting with it here will be a big help, not to mention a more quantitative verification method that everything *works* programatically, not just linting and compiling.
6. When the test is written, it *must* fail first -- this is important to prevent false positives later.
7. Do the thing and make the test go brrrrrrrrrr
8. As each discrete step is implemented and the test passes, mark it as complete in the plan and update that section of the plan document with the date and new version. The plan documents should be the **source of truth**, with the changelog and anything else downstream.
9. Update [**CHANGELOG.md**](#changelog-style) with the above information under add, remove, change, fix, deprecate, security, using [KeepAChangeLog style](https://keepachangelog.com).
  a. Version using [SemVer](https://semver.org/) standards, starting with `0.1.0`. We'll stay in major version 0 for a while, so don't increment it until it's stable enough for someone other than myself to use it. Bump minor version with each new feature committed, and patch version with each bug fix.
  b. Update **package.json** and anything else relevant (like dependencies) when the version is bumped.
9. Return to **#5** and loop until the plan is finished (or something goes terribly wrong and we need to revert to a checkpoint and re-plan)
10. When the plan is fully complete, rename the plan file like so: `<start_version>-<end_version>-PLAN_NAME.md`

### Bug fixes and corrections

1. I send a prompt reporting a bug or something that isn't working.
2. You analyze it, identify the failure mode, and do your thing.
3. Update [**CHANGELOG.md**](#changelog-style) with a new entry bumping the patch version with a brief description of what was done under the Fixed section if the bug was minor, e.g. "the function parameter had the wrong type" or "the API request was malformed".
4. If the fix was more involved, such as adding, removing, or changing things more than a couple lines, esp. types other than variables like interfaces, functions, enums, React elements, etc., then *also* document those addition to the fix under the appropriate sections. See [changelog examples](#fix-examples) if necessary.
5. Update the patch version in **package.json** and anything else relevant.

## Reference

### Gemini TTS Documentation
- [Single-speaker TTS using `generateContent()`](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation#single-speaker)
- [Multi-speaker TTS using `generateContent()`](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation#single-speaker)
- [Single-speaker TTS using `client.interactions.create()`](https://ai.google.dev/gemini-api/docs/speech-generation#single-speaker)
- [Multi-speaker TTS using `client.interactions.create()`](https://ai.google.dev/gemini-api/docs/speech-generation#multi-speaker)

- [Gemini Prompting Guide](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation#prompting-guide)

#### Limitations 
- TTS models can only receive text inputs and generate audio outputs.
- A TTS session has a context window limit of **32k** tokens.
- Review Languages section for language support.
- TTS does not support streaming, except when using `gemini-3.1-flash-tts-preview`.

> [!INFO]
> The following constraints apply specifically when using the `Gemini 3.1 Flash TTS Preview` model for speech generation:

- **Voice inconsistency with prompt instructions**: The model's output may not always strictly match the selected speaker, causing the audio to sound different than expected. To avoid mismatched tones (such as a deep male voice attempting to speak like a young girl), ensure your prompt's written tone and context align naturally with the selected speaker's profile.
- **Quality of longer outputs**: Speech quality and consistency may begin to drift with generated outputs that are longer than a few minutes. We recommend splitting your transcripts into smaller chunks.
- **Occasional text token returns**: The model occasionally returns text tokens instead of audio tokens, causing the server to fail the request with a 500 error. Because this occurs randomly in a very small percentage of requests, you should implement automated retry logic in your application to handle these.
- **Prompt classifier false rejections**: Vague prompts may fail to trigger the speech synthesis classifier, resulting in a rejected request (PROHIBITED_CONTENT) or causing the model to read your style instructions and director's notes aloud. Validate your prompts by adding a clear preamble instructing the model to synthesize speech, and explicitly label where the actual spoken transcript begins.

### Changelog Style

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

> Use Unreleased for partial changes, like implementing a feature in two or more steps. List the changes made, but keep the version bump for when it's *confirmed* working, i.e. *working tests*.

### Added

- REALLY AMAZING FEATURE OMG WOW this is going to be *great* but it's not fully implemented so plz do not use `theBestFunctionEverWritten()` until it leaves the Unreleased section.

### Security

- Removed `all my important passwords and even my banking info.txt`. What a silly oversight!

## [0.2.1] - 2024-09-27

### Added

- Centralized all links into `/data/links.json` so they can be updated easily.

### Fixed

- Everything. Why are the log dates 5 years apart, damn

### Changed

- Updated dependencies

### Removed

- Sample project

## [0.1.0] - 2019-02-15

### Added

- Initial release.

### Security

- Terrible bug.

[unreleased]: https://github.com/tma-2/audiobook-studio/compare/v0.2.1...HEAD
[0.2.2]: https://github.com/tma-2/audiobook-studio/compare/v0.1.0...v0.2.1
[0.1.0]: https://github.com/tma-2/audiobook-studio/compare/v0.1.0...v1.1.0
```

### TODO Style

> [!WARNING]
> *LEAVE `TODO.md` ALONE* for now. I'll update the TODO.md myself with moonshot ideas that may or may not be reasonable.

```markdown
# TODO
- [ ] General / meta items, such as refactors, repository organization, internal things.

## Feature category
> Sections should be organized by functionality, like Data storage / IO, File formats, Frontend / UI / UX, Backend / Server / API, External API handling, etc.

- [ ] Items that are dependent on another task being completed should have them as indented sub-items:
  - [ ] Dependent step
- [ ] feature / change / bugfix / etc. (build version bump)

### Major Feature under category
> We'll be at major version 0 for a while. Increment the minor version for added features, `0.4.0` -> `0.5.0`. Bug fixes should bump the build number.

- [ ] Implement major feature part 1
- [ ] Implement major feature part 2

### Specific Feature, if it falls under one
> All sub-items should be checked before the parent item is checked

- [ ] Implement plan laid out in [KEYBOARD_SHORTCUT_IMPLEMENTATION](./NOTES/KEYBOARD_SHORTCUT_IMPLEMTATION.md)
  - [x] Fix issue with keyboard capture
  - [ ] Update schema for command/keyboard shortcut config files

```

