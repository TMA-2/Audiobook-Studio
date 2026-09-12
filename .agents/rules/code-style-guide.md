---
trigger: always_on
---

# Audiobook Studio Agent Rules

1. Don't over-engineer.
2. Don't over-engineer.
3. Don't write functions, interfaces, classes, templates, etc. that have not been discussed and are not directly related to the functioning of something we're currently adding, changing, or fixing.
4. Summarize changes made into categories aligning with the changelog you will also update, i.e. added, changed, fixed, removed, deprecated, security (for security-related fixes/changes). Place this into `./NOTES/<THING>_IMPLEMENTATION_PLAN.md` where `<thing>` is a short name for it, like `KEYBOARD_SHORTCUTS` or `MULTI-SPEAKER_API_CALLS`
5. Don't write unnecessary code or functions that don't relate to some change we've talked about making, including "temporary workarounds / fallbacks" for errors. If an error is happening and we're trying to fix it, I'm not going to use a workaround or fallback -- and if I do, I'll explicitly suggest we should create it.
6. Version using SemVer. I'm not very good with it, so suggesting version bumps each time a feature is added or issue resolved is fine with me.
7. For *every* change you make (add, remove, fix, deprecate, etc.) make an entry in CHANGELOG.md in the project directory using [KeepAChangeLog style](#changelog-style).
8. Update **TODO.md** if it exists and there's a matching item with every change.
9. If there *isn't* a TODO.md, and we create a plan, verify the plan is written to `./NOTES/PLAN_NAME_IMPLEMTATION.md`. Then, when it's done *with my confirmation* with checkbox items for each discrete trackable thing. The format isn't too important, but there's an example listed anyway.
10. If I click an "auto-fix" button, i.e. you receive a templated prompt like "Fix this error" followed by a big block of exceptions and traceroutes, first tell me what you're planning on doing to fix it *before* implementation.

```md
# TODO

## Section
> Sections could be organized by functionality, like Exporting, UI / UX, API interface, etc.

- [x] Minor changes to some snippet button placement

### Specific Feature, if it falls under one
> All sub-items should be checked before the parent item is checked

- [ ] Implement plan laid out in [KEYBOARD_SHORTCUT_IMPLEMENTATION](./NOTES/KEYBOARD_SHORTCUT_IMPLEMTATION.md)
  - [x] Fix issue with keyboard capture
  - [ ] Update schema for command/keyboard shortcut config files

```

## Changelog Style

```md
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- REALLY AMAZING FEATURE OMG WOW

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

### Fixed

- Terrible bug.

[unreleased]: https://github.com/tma-2/audiobook-studio/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/tma-2/audiobook-studio/compare/v1.1.0...v1.1.2
[1.1.0]: https://github.com/tma-2/audiobook-studio/compare/v1.0.0...v1.1.0
```
