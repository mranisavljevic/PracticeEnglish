# Feature Specification: Volume 4 Student Book & "Coming Soon" Placeholders

**Feature Branch**: `006-vol4-and-coming-soon`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Add the track-to-unit mapping for the Volume 4 Student Book and make that book live on the site. Add greyed-out 'coming soon' placeholders for Volume 1 (student book and workbook), Volume 3 (student book and workbook) and the Volume 4 workbook. Data for those will be released as it becomes available."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Practice with the Volume 4 Student Book (Priority: P1)

A learner who owns the Volume 4 Student Book opens the site, finds the Volume 4 Student Book alongside Volume 2, browses its 14 units, and plays the audio tracks for each unit just as they do for Volume 2.

**Why this priority**: This is the only piece that delivers new audio content; everything else is a placeholder.

**Independent Test**: Open the home page, open the Volume 4 Student Book, open any unit, and play its tracks.

**Acceptance Scenarios**:

1. **Given** the home page, **When** a learner looks at the available books, **Then** the Volume 4 Student Book appears as a normal, selectable book.
2. **Given** the Volume 4 Student Book, **When** the learner opens it, **Then** they see 14 units (chapters 1–14), each listing its audio tracks.
3. **Given** unit N, **When** the learner views it, **Then** it lists exactly the tracks from that chapter's first track up to the track before the next chapter's first track (the final chapter runs to the last available track), using the mapping below.
4. **Given** the book's opening intro track (track 1), **When** the learner browses the book, **Then** that track is not shown in any unit.
5. **Given** a learner scans a Volume 4 page with the existing track-number scanner, **When** a track number is recognized, **Then** it resolves to the correct Volume 4 unit and track, as it does for Volume 2.

**Chapter → first track mapping (Volume 4 Student Book)**:

| Chapter | First track | Chapter | First track |
|---------|-------------|---------|-------------|
| 1 | 2 | 8 | 42 |
| 2 | 7 | 9 | 49 |
| 3 | 12 | 10 | 56 |
| 4 | 18 | 11 | 66 |
| 5 | 24 | 12 | 70 |
| 6 | 28 | 13 | 75 |
| 7 | 35 | 14 | 78 |

---

### User Story 2 - See what's coming soon (Priority: P2)

A learner sees that Volume 1 (Student Book and Workbook), Volume 3 (Student Book and Workbook) and the Volume 4 Workbook are planned. Each shows as a greyed-out "coming soon" entry that clearly cannot be opened, so the learner knows to check back later.

**Why this priority**: Sets expectations and signals the full library without needing audio data.

**Independent Test**: Open the home page and confirm the five placeholders appear greyed out, labeled "coming soon", and do nothing (no broken page) when activated.

**Acceptance Scenarios**:

1. **Given** the home page, **When** it loads, **Then** placeholders appear for Vol 1 Student Book, Vol 1 Workbook, Vol 3 Student Book, Vol 3 Workbook and Vol 4 Workbook.
2. **Given** a placeholder, **When** a learner clicks or taps it, **Then** nothing navigates and no error appears; it is visibly and accessibly marked as unavailable.
3. **Given** the site in Spanish, **When** the home page loads, **Then** the "coming soon" label and placeholder titles are translated like other books.
4. **Given** a placeholder, **When** a screen reader reaches it, **Then** it is announced as unavailable / coming soon.

---

### User Story 3 - Release a placeholder when data arrives (Priority: P3)

The site owner gets track mappings for a placeholder book later and can turn it into a live book by adding its data, without redesigning anything or affecting other books.

**Why this priority**: The owner will release books incrementally; this keeps that cheap, but no learner-facing value until data exists.

**Independent Test**: Take one placeholder, supply a mapping, and confirm it becomes a live book while the others stay greyed out.

**Acceptance Scenarios**:

1. **Given** a placeholder with newly added mapping data, **When** the site is rebuilt, **Then** that book is live and the remaining placeholders are unchanged.

### Edge Cases

- Volume 4 audio files have gaps in numbering (not every track number up to the maximum exists); units list only tracks that actually exist.
- A learner opens a placeholder's address directly (bookmark/old link): they see a friendly unavailable state, not a broken page.
- A placeholder book must never appear in "continue where you left off", progress, or scan-resolution results.
- Existing Volume 2 books, progress, and links remain unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST offer the Volume 4 Student Book as a live book with 14 units, built from the chapter-to-first-track mapping above.
- **FR-002**: Each Volume 4 unit MUST contain all existing tracks from its first track up to (but excluding) the next unit's first track; unit 14 MUST run through the last available track.
- **FR-003**: Volume 4 track 1 (intro) MUST NOT be exposed in any unit.
- **FR-004**: Volume 4 tracks MUST be playable, resumable, and scannable the same way as Volume 2 tracks.
- **FR-005**: The site MUST show greyed-out "coming soon" placeholders for Vol 1 Student Book, Vol 1 Workbook, Vol 3 Student Book, Vol 3 Workbook, and Vol 4 Workbook.
- **FR-006**: Placeholders MUST be non-interactive, visually distinct from live books, and exposed to assistive technology as unavailable.
- **FR-007**: Placeholder text MUST be available in both supported languages (English, Spanish).
- **FR-008**: Placeholders MUST NOT contribute to progress, resume, scan results, or analytics as if they were playable books.
- **FR-009**: Converting a placeholder to a live book MUST require only supplying that book's mapping data.
- **FR-010**: Existing Volume 2 behavior MUST be unaffected.
- **FR-011**: Volume 4 audio MUST be attributed/documented consistently with how Volume 2 audio sources are documented.

### Key Entities

- **Book**: A volume's student book or workbook; either *live* (has units) or *coming soon* (title and type only).
- **Unit**: A chapter of a live book, defined by its first track number.
- **Track**: One audio file belonging to exactly one unit.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can go from the home page to playing any Volume 4 unit's first track in 3 taps/clicks or fewer.
- **SC-002**: 100% of existing Volume 4 Student Book tracks (excluding the intro) appear in exactly one unit.
- **SC-003**: All 5 placeholders are visible on the home page and none can be opened; 0 errors occur when activating them.
- **SC-004**: Spanish and English both display complete placeholder text with no missing labels.
- **SC-005**: Volume 2 content and learner progress are unchanged after release.

## Assumptions

- Each Volume 4 Student Book unit is titled by chapter number (e.g., "Unit N"); chapter titles were not supplied and can be added later. The Volume 2 "Welcome Unit" pattern does not apply.
- Volume 4 Student Book audio files are already present locally under the Level 4 source folder and follow the same hosting/deploy process as Volume 2.
- The five placeholders are shown on the home page alongside live books, ordered by volume.
- "Coming soon" tiles show no cover image and no unit list.
- Library-wide additions (e.g., filtering by volume) are out of scope.
