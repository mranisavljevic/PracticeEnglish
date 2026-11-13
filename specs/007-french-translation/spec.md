# Feature Specification: French Translation

**Feature Branch**: `007-french-translation`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: "Let's add French translation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Use the whole app in French (Priority: P1)

A French-speaking learner of English opens the app and chooses "Français" from the language selector. Every piece of interface text — navigation, headings, book types, unit and track labels, player controls, error messages, offline notice, the scan feature, analytics consent, and credits — appears in French. Book and track titles remain recognizable alongside the translation so the learner can match them to their physical books.

**Why this priority**: This is the entire feature; a partial French interface would leave learners with a confusing mix of languages.

**Independent Test**: Select Français, then visit the home, book, unit, and track screens and trigger an error state; confirm no English or Spanish interface strings appear.

**Acceptance Scenarios**:

1. **Given** the app is shown in English, **When** the learner selects "Français", **Then** all interface text on the current screen switches to French immediately without a reload.
2. **Given** French is selected, **When** the learner navigates through home → book → unit → track and plays a track, **Then** every screen and control label is in French.
3. **Given** French is selected, **When** an error occurs (audio failure, offline, page not found), **Then** the message is shown in French.
4. **Given** French is selected, **When** the learner views book and track titles, **Then** they remain recognizable as the original English-in-Action titles.

---

### User Story 2 - French is remembered and auto-detected (Priority: P2)

A learner whose browser is set to French sees the app in French on first visit with no action. A learner who explicitly picks French keeps it on later visits.

**Why this priority**: Matches the existing multilingual behavior and removes a step for French-speaking users.

**Independent Test**: Load the app with a French browser language and no saved preference; then pick French, reload, and confirm it persists.

**Acceptance Scenarios**:

1. **Given** no saved language choice and a browser language of French (including regional variants such as fr-CA, fr-BE, fr-CH), **When** the app loads, **Then** it is shown in French.
2. **Given** the learner chose French, **When** they return later, **Then** French is still selected.
3. **Given** a saved choice of another language and a French browser, **When** the app loads, **Then** the saved choice wins.

---

### User Story 3 - French appears correctly in the language selector and page metadata (Priority: P3)

The language selector lists "Français" by its native name alongside the existing languages, and the page declares its language correctly for accessibility tools while French is active.

**Why this priority**: Polish that supports discoverability and accessibility.

**Independent Test**: Open the selector and confirm "Français" is listed; select it and confirm the page language reported to assistive technology is French.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the learner opens the language selector, **Then** "Français" is listed with English and Español.
2. **Given** French is active, **When** a screen reader or browser reads the page, **Then** the page language is identified as French.

---

### Edge Cases

- A string present in English but missing from French: the learner sees the English text rather than a blank or a raw key (existing fallback behavior), and a test flags the gap.
- Strings with placeholders (unit numbers, track labels): placeholders remain intact and read naturally in French word order.
- Longer French text (typically longer than English) must not overflow buttons, cards, or the player on narrow mobile screens.
- Browser languages that are not French or otherwise supported continue to fall back to the existing default.
- Typographic conventions (accents, apostrophes, non-breaking spaces before `:`, `?`, `!`) display correctly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST offer French as a selectable interface language, listed by its native name "Français".
- **FR-002**: All user-facing interface strings available in English MUST have a French equivalent, with no hard-coded text left untranslated.
- **FR-003**: Selecting French MUST switch the interface immediately and persist the choice on the learner's device.
- **FR-004**: When no choice has been saved, the app MUST default to French if the browser language is French, including regional variants.
- **FR-005**: Book and track titles MUST remain recognizable alongside French text; the "English in Action" names are not translated.
- **FR-006**: Translations containing dynamic values (unit numbers, track labels) MUST render correctly with those values.
- **FR-007**: The page language indicator MUST report French while French is active.
- **FR-008**: French text MUST fit without clipping or horizontal scrolling at mobile viewport widths.
- **FR-009**: Adding French MUST NOT change behavior for existing English and Spanish users.
- **FR-010**: Automated checks MUST verify that French defines every string key present in English and no extra keys.

### Key Entities

- **Locale**: A selectable interface language with a code, a native display name, and a full set of translated strings.
- **Translation string**: A named piece of interface text with an English source, optional dynamic placeholders, and a French equivalent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of interface strings present in English are available in French.
- **SC-002**: A French-speaking learner can go from opening the app to playing a track without encountering any English or Spanish interface text.
- **SC-003**: A French-language browser user sees the app in French on first load in 100% of tested cases, including regional variants.
- **SC-004**: Switching to French takes one selection and is visible instantly (under 1 second) with no page reload.
- **SC-005**: No text is clipped or causes horizontal scrolling on a 360px-wide screen in French.

## Assumptions

- The French interface is written as standard international French, using informal "tu" or formal "vous" consistently; "vous" is assumed as the safer default for a learning product, matching the tone of the existing Spanish "tú" being a choice to review.
- Translations are produced by the project team (machine-assisted draft acceptable) and reviewed by a French speaker before release.
- Audio content and book titles remain in English; only the interface is translated.
- The scope covers the interface only; no French audio or French book content is added.
- The existing language-selection, persistence, and fallback behavior is reused unchanged.
- Right-to-left and other new-script support are not needed.
