---
trigger: always_on
---
# Audiobook Studio Agent Rules

> This is definitely not comprehensive, and I don't know what ESlint / typescript practices should go in, but I do prefer the Stroustrup brace style, and dict/interface arrays with over three items should be

1. Don't over-engineer.
2. Don't over-engineer.
3. Don't use qualitative / subjective adjectives like "elegant", "beautiful", etc. Stick to the facts of what's being done. Relative descriptors like "more efficient/performant", "faster", "smaller", "less brittle", etc. is perfectly fine when compared to a previous state
4. Don't write functions, interfaces, classes, elements, etc. that have not been discussed and are not directly related to the functioning of something we're currently adding, changing, or fixing.
5. Similar to #4, don't write unnecessary code or functions that don't relate to some change we've talked about making, esp. "workarounds" and "fallbacks" for errors. If an error is happening and we're trying to fix it, I'm not likely to use a workaround or fallback -- if I do, though, I'll explicitly say we should create it.
6. If we create a plan, verify it's written to `./NOTES/PLAN_NAME.md`. Then, when it's done *with my confirmation*, the relevant checkbox items can be ticked. The TODO format isn't too important, but there's [an example listed below](#todo-style), *generally* heirarchical, i.e.
7. Summarize changes made into categories aligning with the changelog you will also update, i.e. added, changed, fixed, removed, deprecated, security (for security-related fixes/changes). Place this into `./NOTES/<THING>_IMPLEMENTATION_PLAN.md` where `<thing>` is a short name for it, like `KEYBOARD_SHORTCUTS` or `MULTI-SPEAKER_API_CALLS`
8. Update [**CHANGELOG.md**](#changelog-style) for *every* change you make (add, remove, fix, deprecate, etc.) using [KeepAChangeLog style](https://keepachangelog.com).
  a. Version using [SemVer](https://semver.org/) standards, starting with `0.1.0`. We'll stay in major version 0 for a while, so don't increment it until it's stable enough for someone other than myself to use it. Bump minor version with each new feature committed, and patch version with each bug fix.
  b. Update **package.json** and anything else relevant when the version is bumped.
  c. Check [**TODO.md**](#todo-style) with every change to check off completed items if they exist. If there isn't a matching item, don't add one. The changelog is more important than the todo.
9. If I click an "auto-fix" button, i.e. you receive a templated prompt like "Fix the below errors" followed by a big block of exceptions and traceroutes, first tell me what you're planning on doing to fix it *before* implementation.

## TODO Style
  ```markdown
  ## Feature category
  ```
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

## Changelog Style

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

> Use Unreleased for partial changes, like implementing a feature in two steps. List the changes made, but keep the version bump for when it's confirmed working.

### Added

- REALLY AMAZING FEATURE OMG WOW but it's not working yet lol

### Security

- Removed `all my important passwords and even my banking info.txt`. What a silly oversight!

## [1.1.2] - 2024-09-27

### Added

- Centralize all links into `/data/links.json` so they can be updated easily.

### Fixed

- Everything

### Changed

- Updated dependencies

### Removed

- Sample project

## [1.1.0] - 2019-02-15

### Added

- Initial release.

### Security

- Terrible bug.

[unreleased]: https://github.com/tma-2/audiobook-studio/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/tma-2/audiobook-studio/compare/v1.1.0...v1.1.2
[1.1.0]: https://github.com/tma-2/audiobook-studio/compare/v1.0.0...v1.1.0
```
