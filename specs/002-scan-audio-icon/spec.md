# Feature Specification: Scan Audio Icon

**Feature Branch**: `002-scan-audio-icon`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Offer an easier way to select audio: after choosing a book, a 'scan audio icon' button lets the student point their phone camera at the printed headphone icon and number in the book; the app reads the number and opens the matching audio file. Available on both the unit selection screen and the track selection screen within a unit. Back navigation must still return to the unit's track list. Mobile-only, shown only when a camera is available. Also included, though unrelated: change the site font to Commissioner (Google Font, downloaded to `~/Desktop/Commissioner/`)."

## Clarifications

### Session 2026-10-28

- Q: When a track number is read from the badge, open the track straight away or ask the student to confirm? → A: Show the detected number and require the student to tap "Open" to confirm.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scan an icon to open its track (Priority: P1)

A student has their book open to a page with a headphone badge (purple in textbooks, dark grey with white numerals in the black-and-white workbooks) showing a track number (e.g. "15"). From the unit list of their selected book, they tap "Scan audio icon", point the phone camera at the badge, and the app recognizes the number and shows it for confirmation; the student taps "Open" and that track's player page opens, ready to play like any track opened by hand.

**Why this priority**: This is the whole feature: replacing "find the unit, find the track number" with one point-and-scan step.

**Independent Test**: With a book selected on a phone with a camera, tap the scan button on the unit list, show a printed badge with a valid track number, and confirm the matching track's player page opens.

**Acceptance Scenarios**:

1. **Given** a student has selected a book and is on the unit selection screen on a camera-equipped phone, **When** they tap "Scan audio icon" and point the camera at a badge reading "15", **Then** the detected number "15" is shown with an "Open" control; **When** they tap "Open", **Then** the camera view closes and the player page for track 15 of that book opens, even though no unit was chosen first.
2. **Given** a detected number is shown for confirmation, **When** the student does not confirm and instead re-aims the camera at another badge, **Then** the shown number updates to the newly detected one and nothing opens until "Open" is tapped.
3. **Given** the student arrived at a track via scanning from the unit selection screen, **When** they use the app's back control, **Then** they return to the track list of that track's unit (not to the camera and not to the unit list).
4. **Given** the scanner is open, **When** the student cancels it, **Then** they return to the screen they started from, unchanged.

---

### User Story 2 - Scan from inside a unit (Priority: P2)

A student already viewing a unit's track list taps "Scan audio icon" to jump to a specific track by pointing at its badge, instead of scrolling and tapping the number.

**Why this priority**: Same capability on the second screen the owner requested; slightly less valuable since the list is already narrowed to one unit.

**Independent Test**: Open any unit's track list, scan a badge for a track in that unit, and confirm the track opens and back returns to the same track list.

**Acceptance Scenarios**:

1. **Given** a student is on a unit's track list, **When** they scan a badge whose number is a track in that unit and confirm with "Open", **Then** that track's player page opens, and back returns to that unit's track list.
2. **Given** a student is on a unit's track list, **When** they scan a badge whose number belongs to a different unit of the same book and confirm with "Open", **Then** that track opens and back returns to the track list of the unit that track belongs to.

---

### User Story 3 - Only offered where it can work (Priority: P2)

The scan button appears only on phones/tablets that have a usable camera, so desktop and camera-less users never see a broken option and the existing manual flow is unchanged for them. If camera permission is refused or the camera fails, the student gets a clear message and an easy way back to manual selection.

**Why this priority**: Prevents a dead-end control and protects the existing experience; required for the feature to ship safely.

**Independent Test**: Load the app on a desktop browser and on a device with no camera: no scan button. On a phone, deny camera permission: a translated message with a way back appears.

**Acceptance Scenarios**:

1. **Given** a desktop computer or a device with no camera, **When** the student views the unit or track screen, **Then** no scan button is shown.
2. **Given** a phone with a camera, **When** the student views the unit or track screen of a selected book, **Then** the scan button is shown.
3. **Given** the student refuses camera access, **When** the scanner tries to start, **Then** a translated explanation is shown with a way to return to manual selection.

---

### User Story 4 - Site uses the Commissioner typeface (Priority: P3)

Independent of scanning, a student sees all text on the site (headings, titles, track buttons, player controls, breadcrumbs, footer, language switcher, and the new scanner's text) set in the Commissioner typeface instead of the device's default font. Text is visible immediately in a fallback font and the font never blocks the page from being usable.

**Why this priority**: A visual refresh requested alongside this feature; unrelated to scanning and shippable on its own.

**Independent Test**: Open each page and confirm all text, including form controls, renders in Commissioner; throttle the network and confirm text is visible before the font loads; switch between English and Spanish and confirm no missing-glyph boxes.

**Acceptance Scenarios**:

1. **Given** the site is loaded, **When** the student views any page, **Then** all text, including buttons and the language selector, appears in Commissioner, with regular, semi-bold and bold emphasis shown as true Commissioner weights.
2. **Given** a slow connection or a font that fails to load, **When** the page renders, **Then** text is visible right away in a fallback font and the site stays fully usable.
3. **Given** either supported language, **When** text is displayed, **Then** every character renders without missing-glyph boxes.

---

### Edge Cases

- No number is recognized (poor light, blur, no badge in view): the scanner keeps trying and, after a few seconds without success, shows a translated hint (hold steady, more light, fill the frame with the badge); it never opens a wrong track.
- A number is recognized that is not a track in the selected book (e.g. another level's book): the student is told the number was not found in this book, and scanning continues or can be cancelled; nothing is opened.
- Several badges are in view (common: workbook pages often show 3 or more, e.g. 13, 14, 15): the system opens only the badge closest to a centered aiming target shown on screen, and the student aims by moving the phone close to the one they want. If two badges are equally close, nothing opens and the tips message asks the student to move closer to one. Plain page numbers, exercise numbers and unit numbers are ignored.
- Badge is very small in frame (student holding the phone at full-page distance): the system keeps scanning and shows a "move closer" hint rather than guessing.
- A misread (e.g. "15" read as "16") is shown in the confirmation step before anything opens, so the student can compare it with the printed badge and re-aim instead of confirming; if a wrong track is opened anyway, back returns to the unit's track list, and the player page shows the track number so a mistake is easy to notice.
- The student scans while offline: scanning works only if the scanner's assets are still in the browser's HTTP cache from a prior use on this device; otherwise the "scanner unavailable" message is shown. Opening the track follows the existing offline behavior for audio.
- The device is rotated or the app is backgrounded while scanning: the camera is released when leaving the scanner and scanning can be restarted.
- Browsers or in-app webviews that cannot provide camera access: treated as "no usable camera"; the button is hidden.
- The selected book has no scannable tracks (title-read tracks are omitted per the Level 2 MVP): their numbers are treated as not found.
- Font: a character Commissioner lacks, or a font that is blocked or fails to download, falls back to a readable system font without breaking layout.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Once a book is selected, the unit selection screen and the track selection screen (within a unit) MUST each offer a clearly labeled "Scan audio icon" button.
- **FR-002**: The scan button MUST be shown only when the device appears to have a usable camera and is a phone/tablet-class touch device; otherwise it MUST be hidden and all existing manual selection MUST remain unchanged.
- **FR-003**: Tapping the button MUST open a live camera view with brief guidance on what to point at, and a visible control to cancel.
- **FR-004**: The system MUST recognize the track number printed in the headphone badge in the camera view, while ignoring other numbers on the page. Recognition MUST work for both the purple (textbook) and dark-grey (workbook) badge styles and MUST NOT depend on the badge's color. When several badges are visible, it MUST choose the one nearest an on-screen aiming target at the center of the view, and MUST NOT open a track if the choice is ambiguous.
- **FR-005**: On recognizing a number that is a track of the currently selected book, the system MUST display the detected number with an "Open" control, MUST NOT navigate until the student taps it, and on confirmation MUST close the camera and open that track's player page, from either entry screen, regardless of which unit the track belongs to. While unconfirmed, the displayed number MUST update if a different badge is recognized.
- **FR-006**: After a scan opens a track, back navigation MUST go to the track list of the unit containing that track, and from there continue through the normal hierarchy; the scanner MUST NOT appear in back history.
- **FR-007**: If the recognized number is not a track in the selected book, the system MUST show a translated "not found in this book" message and MUST NOT navigate.
- **FR-008**: The system MUST NOT open a track unless a number was recognized with sufficient confidence; when nothing is recognized after a few seconds it MUST show a translated tips message while continuing to scan.
- **FR-009**: If camera permission is denied or the camera cannot start, the system MUST show a translated message explaining the problem and offering a way back to manual selection.
- **FR-010**: Camera images MUST be processed on the student's device only; they MUST NOT be stored or sent anywhere, and the camera MUST be released whenever the scanner closes (constitution: no personal data collection).
- **FR-011**: All new user-visible text MUST be provided in English and Spanish through the translation resources.
- **FR-012**: The scanner MUST be operable with large touch targets at 360px width and usable in portrait orientation.
- **FR-013**: A track opened by scanning MUST be remembered for "Continue" exactly like a track opened manually.
- **FR-014**: All text across the site MUST be displayed in Commissioner, including form controls and buttons, with regular, semi-bold and bold emphasis using matching Commissioner weights.
- **FR-015**: The font MUST be served from the site itself, not a third-party font service; its license file (SIL Open Font License, supplied with the download) MUST be included with it.
- **FR-016**: Text MUST remain visible while the font loads, falling back to a readable system font until Commissioner is ready or if it fails or lacks a character.
- **FR-017**: Only the weights and character sets actually used MUST be shipped, so the font adds no more than about 100 KB to a first visit, and the change MUST NOT alter layout, content or behavior beyond typography.

### Key Entities

- **Scan Result**: The track number read from the camera and whether it matched a track in the selected book; drives navigation or an error message.
- **Track (existing)**: Identified by its printed number within a book; the scan resolves a number to a track and its unit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In typical indoor lighting, a student sees the correct detected number within 5 seconds of the scanner finishing loading and the camera pointing at a clear badge, so the track's player page is reachable with one confirming tap, in at least 90% of attempts across both textbook (purple) and workbook (dark-grey) badge styles.
- **SC-002**: From the unit list, reaching a track by scanning takes at most 2 taps (scan button, then "Open") and requires no knowledge of which unit the track belongs to, versus choosing the right unit and then the track manually.
- **SC-003**: 0% of scans with no recognizable badge navigate to a track.
- **SC-004**: On devices without a camera and on desktop, 100% of screens show no scan button and manual selection works exactly as before.
- **SC-005**: After any successful scan, one back action always lands on the correct unit's track list.
- **SC-006**: 90% of first-time users on a phone complete a scan (including granting camera access) without help.
- **SC-007**: 100% of pages show their text in Commissioner on modern mobile and desktop browsers, with no added blank-text period on a throttled connection and no missing-glyph boxes in English or Spanish.

## Assumptions

- Track numbers are unique within a book, so a number alone identifies the unit and track within the selected book (consistent with the existing unit track ranges).
- The badge is the printed headphone icon in a filled box followed by a number: purple in textbooks, dark grey with white numerals in workbooks (both sampled in `~/Downloads`). Other series or badge styles are out of scope.
- Badges are small relative to the page, so students are expected to bring the phone close; the aiming target and hints guide this.
- The scan is scoped to the currently selected book; matching across other books is out of scope.
- Scanning is shown only after a book is selected (not on the home or book list).
- The feature needs a browser that can grant camera access, which typically requires a secure (HTTPS) connection; the deployed site already meets this.
- Sample photos (`~/Downloads/page_sample.HEIC`, `audio_icon_sample.HEIC`, `wb_page_sample.HEIC`, `wb_audio_icon_sample.HEIC`) may be used as reference for recognition testing.
- Builds on specs/001-audio-practice-site; only Level 2 content is currently shipped, so only its tracks are scannable at launch.
- Font: Commissioner is licensed under the SIL Open Font License, which permits self-hosting. The download contains a variable font and static weights; which to ship is a planning decision guided by FR-017. Only regular, semi-bold and bold are needed; italics are out of scope.
