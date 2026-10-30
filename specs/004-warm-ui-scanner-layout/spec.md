# Feature Specification: Warm Background & Scanner Layout Refresh

**Feature Branch**: `worktree-ui-design-updates`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "Minor UI changes: keep the blue accent and existing layout, but replace white backgrounds with a slightly warmer cream/sand/beige so the site feels more welcoming. In the scanner, make the camera viewport somewhat smaller so there is more room for the controls below it, with padding between the buttons and the bottom of the screen. Show the 'Scan audio icon' title and 'Point the camera at the audio icon…' instructions as a header at the top, and keep the error/progress status text at the bottom where it is now."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Warmer, more welcoming look (Priority: P1)

A learner opens the site and sees pages with a soft cream/sand background instead of stark white. The blue used for links, buttons and highlights is unchanged, and the layout is otherwise the same.

**Why this priority**: It affects every page and is the main goal of the refresh.

**Independent Test**: Open the home, book, unit and track pages and confirm no page area uses pure white as its background, while text stays easy to read and blue accents are unchanged.

**Acceptance Scenarios**:

1. **Given** any page of the site, **When** it loads, **Then** the page background is a subtle warm off-white (cream/sand tone) rather than pure white.
2. **Given** cards, inputs, the language selector and secondary buttons that previously used white, **When** they are shown, **Then** they use the warm tone (or a harmonious variant) so nothing looks like a stark white patch against the page.
3. **Given** the new background, **When** text, links and buttons are displayed, **Then** they remain clearly legible and the blue accent color looks the same as before.

---

### User Story 2 - Scanner header with title and instructions (Priority: P2)

A learner opens the scanner and sees the "Scan audio icon" title and the "Point the camera at the audio icon and hold steady." instructions together as a header at the top of the screen. Progress and error messages stay at the bottom, near the buttons.

**Why this priority**: Makes it clear what to do before aiming the camera and separates guidance (top) from feedback (bottom).

**Independent Test**: Open the scanner and confirm title and instructions appear at the top; trigger loading, hint, not-found and error states and confirm each message appears at the bottom.

**Acceptance Scenarios**:

1. **Given** the scanner is open, **When** the camera is starting or scanning, **Then** the title and instructions are shown as a header at the top of the screen.
2. **Given** the scanner is open, **When** a progress, hint, detected, not-found or error message is shown, **Then** it appears in the bottom area above the action buttons, as it does today.
3. **Given** the camera is blocked or unavailable, **When** the error state is shown, **Then** the title remains at the top, the error message is at the bottom, and the "Choose manually" button is reachable.

---

### User Story 3 - Smaller viewport and comfortable button area (Priority: P2)

A learner using a phone sees a slightly smaller camera viewport, leaving more room below for status text and buttons, with clear padding between the buttons and the bottom edge of the screen so they are easy to tap.

**Why this priority**: Improves tap comfort and prevents controls from crowding or being hidden by device edges.

**Independent Test**: Open the scanner on a typical phone-sized screen and confirm the buttons have visible spacing from the bottom edge and the camera view is smaller than before while scanning still works.

**Acceptance Scenarios**:

1. **Given** the scanner is open on a phone-sized screen, **When** it is displayed, **Then** the camera viewport occupies noticeably less of the screen than before, leaving a dedicated area below it for status and buttons.
2. **Given** the scanner is open, **When** buttons are displayed, **Then** there is clear padding between the lowest button and the bottom edge of the screen, including on devices with a home indicator or rounded corners.
3. **Given** the smaller viewport, **When** the learner aims at an audio icon, **Then** the icon can still be detected and the scan guide frame stays within the visible camera area.

---

### Edge Cases

- Small or short screens and landscape orientation: header, viewport, status and buttons must all remain visible without overlapping; the viewport shrinks first.
- Long translated text (Spanish) in the header or status: must wrap without pushing buttons off-screen.
- Multiple status lines shown at once (e.g., "Track 5" plus a hint): the bottom area grows without overlapping the viewport or buttons.
- Browser zoom or larger system text sizes: layout remains usable.
- The dark scanner backdrop remains distinct from the warm page background.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site MUST use a warm off-white (cream/sand/subtle beige) as the main page background in place of pure white.
- **FR-002**: Surfaces that were white (secondary buttons, form controls such as the language selector, and similar) MUST adopt the warm tone or a harmonious variant so no stark white remains.
- **FR-003**: The existing blue accent color, overall page layout and typography MUST remain unchanged.
- **FR-004**: Text and interactive elements MUST keep sufficient contrast against the warm background (at least the same level as today, meeting WCAG AA).
- **FR-005**: The scanner MUST show the title and instructions together as a header at the top of the screen.
- **FR-006**: The scanner MUST show loading, hint, detected, not-found and error messages in the bottom area, above the action buttons.
- **FR-007**: The scanner's camera viewport MUST be smaller than today, reserving a distinct area below it for status text and buttons.
- **FR-008**: The scanner MUST keep visible padding between the lowest button and the bottom screen edge, respecting device safe areas.
- **FR-009**: The scan guide frame MUST remain within the camera viewport and scanning accuracy MUST NOT regress.
- **FR-010**: Existing scanner behavior (opening a detected track, cancel, choose manually, keyboard/Escape handling, announcements of status changes to assistive technology) MUST continue to work.
- **FR-011**: The header and bottom area MUST work for both supported languages, including longer text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of site pages and the scanner screen show no pure-white page or surface backgrounds.
- **SC-002**: All text/background combinations meet at least WCAG AA contrast (4.5:1 for body text).
- **SC-003**: On a 360×640 screen, the scanner's buttons sit at least 16px above the bottom edge and are fully visible without scrolling.
- **SC-004**: The scanner viewport takes up at least 15% less of screen height than before, while the header and the bottom status area are both fully visible.
- **SC-005**: Track detection success in the scanner is no worse than before the change.
- **SC-006**: In a quick review, the person requesting the change agrees the new look feels warmer and the scanner easier to use one-handed.

## Assumptions

- "Warm white" means a pale cream/sand tone close to white (not a strongly tinted beige); the exact shade will be chosen in planning, subject to the contrast requirement.
- The existing blue, fonts, card styling and page structure are kept as-is.
- Only the scanner screen layout changes; other flows are untouched.
- The scanner's dark backdrop and light-on-dark text remain, since it is a camera view.
- No new text or translations are required; existing strings are repositioned.
- Builds on the existing scan audio icon feature (spec 002).
