# Feature Specification: PracticeEnglish Audio Site

**Feature Branch**: `001-audio-practice-site`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Register practiceenglish.net as a free, easy way for students (especially those with limited or no English) to listen to the audio files for the English in Action textbook series and related workbooks. Start with English and Spanish, with more languages addable by supplying translations only. Fully supported on desktop and mobile, with mobile expected to be most common. Users pick their book, then the unit, then the numbered audio file printed in the book. The site remembers the language selection and the last book, unit, and file listened to so learners can continue another day."

## Clarifications

### Session 2026-10-18

- Q: When a student taps Continue, should audio resume at the saved position or restart the last file? → A: Always restart the last file from the beginning; playback position is not stored.
- Q: When a track finishes, should the next track play automatically? → A: No; playback stops at the end and the student taps Replay or Next.
- Q: Should the player offer slower playback? → A: Yes, a simple speed choice (0.75× and 1×); not remembered between visits and resets to 1× for each file.
- Q: Should selecting another file stop the one currently playing? → A: Yes; only one file plays at a time.
- Q: Should the site work offline once loaded? → A: No; online only, with a clear translated offline message.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find and play an audio file from my book (Priority: P1)

A student holding their English in Action book (or workbook) opens the site on their phone, chooses their book, then the unit, then the audio file number printed in the book, and the audio plays.

**Why this priority**: This is the entire reason the site exists. Without it there is no product.

**Independent Test**: With a small set of sample content (one book, one unit, a few files), open the site on a phone-sized screen, select the book, unit and file number, and confirm the matching audio plays.

**Acceptance Scenarios**:

1. **Given** the site is open, **When** the student selects a book, **Then** the units of that book are shown.
2. **Given** a book is selected, **When** the student selects a unit, **Then** the audio file numbers in that unit are shown, labeled with the same numbers printed in the book.
3. **Given** a unit is selected, **When** the student selects a file number, **Then** the matching audio starts playing (or is ready to play with one tap) with visible play/pause controls.
4. **Given** the student is partway through the selection, **When** they go back one step, **Then** they return to the previous list (the Back control and the browser's back button behave the same), and the selection above it stays as in the URL.
5. **Given** a book with several textbook and workbook editions, **When** viewing the book list, **Then** each book is identifiable by its title and cover or level so it can be matched with the physical book.

---

### User Story 2 - Use the site in my own language (Priority: P1)

A student who speaks little or no English can read the site's interface in Spanish (or English), switch languages at any time, and have that choice remembered on return visits.

**Why this priority**: The audience is specifically learners with limited English; an English-only interface would defeat the purpose.

**Independent Test**: Open the site with the device language set to Spanish and confirm Spanish is shown; switch to English, reload, and confirm English persists.

**Acceptance Scenarios**:

1. **Given** a first visit with no saved choice, **When** the site loads, **Then** it uses the device's language if supported, otherwise English.
2. **Given** the site is open, **When** the student changes language, **Then** all interface text changes immediately without losing their current book/unit/file selection or playback.
3. **Given** the student previously chose a language, **When** they return on a later day, **Then** that language is used.
4. **Given** a new language is added by providing its translations, **When** the site is published, **Then** it appears in the language choices with no other change needed.
5. **Given** any language, **When** books and files are listed, **Then** the original English book titles remain visible so they match the physical book.

---

### User Story 3 - Continue where I left off (Priority: P2)

A returning student opens the site and can resume their last book, unit and file with one action instead of navigating again.

**Why this priority**: Students use the same book repeatedly over weeks; this removes repeated effort, but the site is still usable without it.

**Independent Test**: Play a file, close the browser, reopen the site, and confirm a one-tap "continue" option leads to the same book, unit and file.

**Acceptance Scenarios**:

1. **Given** the student has listened to a file before, **When** they open the site, **Then** a prominent "Continue" option names their last book, unit and file.
2. **Given** the Continue option is shown, **When** the student activates it, **Then** the last file is selected and ready to play from the beginning (playback position within a file is not remembered).
3. **Given** the student plays a different file, **When** they return later, **Then** Continue points to the most recent file.
4. **Given** a first-time visitor, **When** the site opens, **Then** no Continue option is shown and the book list is presented.
5. **Given** saved progress refers to content that no longer exists, **When** the site opens, **Then** it ignores the stale progress and shows the book list without an error.

---

### User Story 4 - Comfortable listening on mobile and desktop (Priority: P2)

A student can use the whole experience one-handed on a phone and equally well on a laptop, and move between audio files easily for repeated listening.

**Why this priority**: Mobile is expected to be the most common device; basic layout adaptation is needed for P1 to be usable, while extra convenience is secondary.

**Independent Test**: Complete the P1 journey at phone width (360–400px) and at desktop width, confirming nothing is cut off, controls are easy to tap, and no horizontal scrolling occurs.

**Acceptance Scenarios**:

1. **Given** a phone-sized screen, **When** the student uses any part of the site, **Then** all content fits without horizontal scrolling and controls are large enough to tap reliably.
2. **Given** a desktop screen, **When** the site is used, **Then** the layout makes sensible use of the space and is fully usable by keyboard.
3. **Given** a file is playing, **When** the student wants to hear it again or move on, **Then** they can replay, or go to the previous/next file in the unit, in one action.
4. **Given** a slow mobile connection, **When** a file is selected, **Then** playback starts without waiting for the entire file to download, and a clear loading indication is shown.

---

### Edge Cases

- A selected audio file is missing or fails to load: show a clear, translated message and let the student retry or choose another file.
- The device is offline: the site requires an internet connection (no offline mode or audio caching at launch) and shows a clear, translated message rather than a blank page.
- Browser storage is unavailable or cleared: the site works fully, just without remembering language or progress.
- Device language is unsupported (e.g., French): fall back to English.
- A translation is missing for a specific text in a language: that text falls back to English rather than showing a blank or a raw key.
- A unit has audio files numbered non-consecutively or with letters (e.g., "12a"): numbers appear exactly as printed in the book.
- The student opens a direct link to a specific book/unit/file: it opens that content (and remembers it as the last file, same as opening it by browsing).
- Long titles or longer translated text must not overflow or hide controls on narrow screens.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Students MUST be able to browse a list of available books (textbooks and workbooks of the English in Action series) and select one.
- **FR-002**: After selecting a book, students MUST be able to see and select a unit of that book.
- **FR-003**: After selecting a unit, students MUST be able to see and select an audio file by the same number printed in the book.
- **FR-004**: Selecting an audio file MUST allow the student to play it with play/pause and the ability to replay it; previous/next navigation within a unit MUST be available. When a file finishes, playback MUST stop (no automatic advance to the next file) and Replay and Next MUST remain one action away. The player MUST offer a playback speed choice of 0.75× and 1× (default 1×); the choice is not persisted and resets to 1× when a different file is selected. Only one file MAY play at a time; selecting another file MUST stop the current one.
- **FR-005**: Navigating back from any step MUST return to the prior step in the book → unit → file hierarchy, and every book/unit/file MUST have its own shareable link.
- **FR-006**: The site MUST be free to use with no account, sign-up, or payment.
- **FR-007**: The interface MUST be available in English and Spanish at launch, and all user-visible text MUST come from per-language translation resources.
- **FR-008**: Adding a new language MUST require only supplying its translations (and its display name); no changes to feature logic.
- **FR-009**: The system MUST default to the device's language when supported, otherwise English, and MUST let the student change language at any time from every page.
- **FR-010**: The system MUST remember the student's language choice across visits on the same device.
- **FR-011**: The system MUST remember the last book, unit and audio file the student opened ("listened to" means a file's page was opened or played, not that playback finished), and offer a one-action Continue option on return visits. Playback position within a file MUST NOT be stored; Continue always starts the file from the beginning.
- **FR-012**: Remembered data MUST be kept on the student's own device; the site MUST NOT require or collect personal information.
- **FR-013**: The site MUST be fully usable at phone widths (down to about 360px) and desktop widths, with touch-friendly controls and keyboard operability.
- **FR-014**: Audio MUST begin playing without requiring the complete file to download first.
- **FR-015**: The site MUST show translated, understandable messages when audio is missing, fails to load, or the device is offline.
- **FR-016**: The list of books, units and audio files MUST be defined as content data separate from the interface, so adding or correcting content does not require changing feature logic.
- **FR-017**: Book titles and file numbers MUST remain recognizable as printed in the books regardless of the interface language.
- **FR-018**: The site MUST credit English in Action and its publisher as the source of the content and MUST NOT imply publisher endorsement.
- **FR-019**: The audio files MUST be served from a practiceenglish.net domain or subdomain (e.g. audio.practiceenglish.net), using files the publisher makes freely available for public download. Hosting without explicit publisher permission is a risk knowingly accepted by the owner (see constitution v1.1.0); content MUST be removable promptly on request from the rights holder.

### Key Entities

- **Level**: A grouping of books in the series (for example by difficulty level); contains textbooks and workbooks.
- **Book**: A textbook or workbook in the series; belongs to one level; has a title as printed, a type (textbook or workbook), an optional cover image, and an ordered set of units.
- **Unit**: A numbered/titled division of a book; belongs to one book; contains audio files.
- **Audio File (Track)**: One recording, identified by the number printed in the book; belongs to one unit; has its audio source. The plan and code call this a "track".
- **Language**: A supported interface language with a display name and a full set of translated interface text.
- **Learner Preferences**: The student's chosen language, stored on their device.
- **Listening Progress**: The last book, unit and audio file listened to, stored on the student's device.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time student can go from opening the site to hearing a specific audio file in 4 taps/clicks or fewer after the site loads (book, unit, file, play).
- **SC-002**: A returning student can reach their last audio file, ready to play from the beginning, in 1 action (tapping Continue) from the home screen; starting playback is one further tap.
- **SC-003**: 90% of test participants with limited English can successfully find and play a requested file from their book on a phone without help, using the Spanish interface. This is validated after launch with real learners; it is not a build-time gate and has no implementation task.
- **SC-004**: Audio begins playing within 3 seconds of selection on a typical mobile connection.
- **SC-005**: The home screen is usable (books visible and selectable) within 3 seconds on a typical mobile connection.
- **SC-006**: 100% of interface text is available in both English and Spanish at launch, with no hard-coded untranslated text.
- **SC-007**: Language choice and last-listened position persist across at least 30 days of return visits on the same device (unless the student clears browser data).
- **SC-008**: The full journey works with no horizontal scrolling and no unreachable controls at phone widths of 360px and above and at common desktop widths.
- **SC-009**: A new language can be made available by one contributor supplying one set of translations, without changes to feature logic.

## Assumptions

- Target users are students and teachers using the *English in Action* series and companion workbooks, many with limited or no English reading ability, so the interface favors short labels, large controls and recognizable icons.
- Spanish and English are the initial languages; additional languages come later by supplying translations.
- The site is a free, public, no-account experience; progress and preferences are stored only on the student's own device and do not sync across devices.
- Audio files are obtained by the site owner and added as content; the exact catalogue of books, units and file numbers will be defined as content data from the source materials.
- Only listening is in scope: no transcripts, exercises, answer keys, search, user accounts, or downloads at launch.
- Playback position within a file is not remembered; only the last book, unit and file are stored. (This narrows constitution Principle III, which mentions track position; see constitution v2.0.0.)
- The site is built and deployed with the owner's preferred toolchain (Vite and Netlify, as in the `comk` project) on the practiceenglish.net domain; these choices belong in the plan.
- Audio is limited to files freely and publicly downloadable from the publisher; no explicit publisher permission has been obtained, and the owner accepts that risk.
