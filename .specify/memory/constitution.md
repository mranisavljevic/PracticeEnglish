<!--
Sync Impact Report
- Version change: 1.1.0 → 2.0.0 (MAJOR: principle III redefined in a backward-incompatible way)
- Modified: III. Resume Where You Left Off — stores last-played track but NOT playback
  position; resuming a track always starts from the beginning.
- Impact: any spec/plan/task/test requiring saved playback position (e.g. in
  specs/001-audio-practice-site) MUST be updated to remove it; resume = navigate to the
  last track and play from 0:00.
---- Previous report (1.1.0) ----
- Version change: 1.0.0 → 1.1.0 (MINOR: Technology & Content Constraints materially changed)
- Modified: content-hosting constraint now permits hosting freely downloadable publisher audio
  without written permission (owner accepts legal risk); adds takedown-on-request duty.
- Impact: specs/001-audio-practice-site FR-019 resolved accordingly.
---- Previous report (1.0.0) ----
- Version change: (template, unversioned) → 1.0.0
- Modified principles: none renamed; all five template slots filled for the first time
  - I. Mobile-First, Fast Access
  - II. Multilingual by Default
  - III. Resume Where You Left Off
  - IV. Test-First (NON-NEGOTIABLE)
  - V. Simplicity
- Added sections: Technology & Content Constraints; Development Workflow & Quality Gates
- Removed sections: none
- Follow-up TODOs: none. Accessibility, privacy and offline support were not chosen as
  principles; they appear only as constraints and may be promoted later by amendment.
- Templates: dependent templates read this file at runtime; none modified.
-->
# PracticeEnglish Constitution

## Core Principles

### I. Mobile-First, Fast Access
PracticeEnglish is a web app used mainly on mobile browsers and MUST also work well on desktop.
Every UI MUST be designed for a narrow touch screen first and then enhanced for larger screens.
A learner MUST be able to reach and start playing any audio track in as few taps as possible,
with no account, sign-up wall, or boilerplate navigation required. Pages MUST be usable on
slow mobile connections. Audio MUST stream rather than require a full download before play.
Rationale: the product exists because the source website is hard to use; ease of access is its
core value.

### II. Multilingual by Default
The interface MUST be available in multiple languages, selected by user preference. All
user-facing strings MUST come from translation resources, never be hard-coded in components.
Adding a language MUST NOT require code changes beyond adding translation resources and
registering the locale. The learner's language choice MUST be remembered and MUST default to
the browser's language when no choice has been made. Book and track titles MUST remain
recognizable alongside any translation so learners can match them to their physical books.
Rationale: the source site is English-only, which is a barrier for the very learners it serves.

### III. Resume Where You Left Off
The app MUST remember the learner's book series level, book type (textbook or workbook), and
last-played track, and MUST let them return to that track in one action from the home screen.
The playback position within a track MUST NOT be stored; resuming a track MUST start playback
from the beginning. Progress MUST be stored on the learner's device by default and MUST work without
an account. The content model MUST represent the hierarchy of level → book (textbook or
workbook) → unit/track explicitly, so that navigation and resume do not depend on parsing
display text. Rationale: learners use a specific book at a specific level and should not repeat
navigation to find their place; short practice tracks are replayed from the start, so a saved
position adds state without value.

### IV. Test-First (NON-NEGOTIABLE)
Tests MUST be written and observed to fail before the implementation that makes them pass
(Red-Green-Refactor). Every user-facing behavior in a spec MUST have an automated test.
Resume/progress logic, content-hierarchy navigation, and locale selection and fallback MUST
have unit tests. Critical journeys (open app → pick or resume a track → play) MUST have an
end-to-end test at mobile viewport size. A change MUST NOT be merged while tests fail.
Rationale: persistence and localization bugs are silent and easy to regress.

### V. Simplicity
Build the smallest thing that satisfies the spec (YAGNI). Prefer platform features (HTML audio,
browser storage, native routing) over added dependencies. Each new runtime dependency or
architectural layer MUST be justified in the plan. Rationale: a lightweight app loads faster on
mobile and is easier to maintain.

## Technology & Content Constraints

- The app MUST be a web application written in TypeScript with React. Strict type checking MUST
  be enabled.
- Audio and book content belongs to the publisher of *English in Action*. The app MAY host
  copies of audio files that the publisher makes freely available for public download, without
  explicit written permission. The project owner has knowingly accepted the legal uncertainty
  of this choice (decision recorded 2026-10-18). The app MUST NOT host content that is not
  freely and publicly available from the publisher, MUST NOT circumvent any access control,
  and MUST NOT claim ownership of the content.
- The app MUST credit the original source and MUST NOT imply endorsement by the publisher. If
  the rights holder asks for content to be removed, it MUST be removed promptly.
- Interactive controls MUST be keyboard-operable and have accessible labels, and touch targets
  MUST be large enough for comfortable mobile use.
- The app MUST NOT collect personal data. Any analytics or data leaving the device requires a
  constitution amendment or a documented spec-level justification.

## Development Workflow & Quality Gates

- Work follows the Spec Kit flow: specify → plan → tasks → implement. Plans MUST include a
  Constitution Check against this document.
- Before merge: type check, lint and the full test suite MUST pass.
- Reviews MUST verify compliance with these principles; any deviation MUST be recorded and
  justified in the plan's complexity/deviation section.
- New or changed user-facing text MUST include translations for all supported languages, or an
  explicit fallback to English recorded in the change.

## Governance

This constitution supersedes other practices in this repository. Amendments MUST be made by
editing this file with a Sync Impact Report, a version bump, and an updated Last Amended date,
and MUST include a note on any impact on existing specs, plans or code. Versioning follows
semantic versioning: MAJOR for removing or redefining a principle in a backward-incompatible
way, MINOR for adding a principle or section or materially expanding guidance, PATCH for
clarifications and wording fixes. Compliance MUST be checked at every plan (Constitution Check)
and at every review.

**Version**: 2.0.0 | **Ratified**: 2026-10-18 | **Last Amended**: 2026-10-18
