# Feature Specification: Google Analytics Migration

**Feature Branch**: `005-google-analytics-migration`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "We just implemented some basic analytics, but now I realize it seems it would be better to have them in Google Analytics so that all of my apps' data is in the same place."

## Constitution Justification *(required by Technology & Content Constraints)*

The constitution forbids collecting personal data and requires a spec-level justification for any analytics or data leaving the device. This feature replaces the self-hosted analytics from spec 003 with Google Analytics so the owner sees all of their apps in one place. Google Analytics is a third-party service that, by default, assigns a persistent per-browser identifier and may derive location, browser, and OS detail. That conflicts with 003's FR-007 (no persistent per-person identifiers) and the constitution's "MUST NOT collect personal data" rule. Therefore this feature MUST either (a) be configured to stay within those limits (no advertising features, no cross-site linking, no user-level identifiers, IP anonymisation, minimal retention), or (b) be accompanied by a constitution amendment that explicitly permits Google Analytics with the safeguards below. Choosing (b) is expected; the amendment is part of this feature's scope, and 003's FR-007 is superseded accordingly.

## Clarifications

### Session 2026-10-30

- Q: Should the consent prompt appear for every visitor, or only for visitors in regions that legally require it? → A: Show it to every visitor; nothing is sent until they opt in; a configuration flag lets the owner turn it off later.
- Q: Should Google Analytics' automatic extra events (scrolls, outbound clicks, downloads, etc.) be turned off so only our own events are sent? → A: Yes; disable all automatic/enhanced measurement and send only the five defined events (visit, track started, resume used, language changed, error).

### Session 2026-11-02

- Q: When a visitor's browser sends Do Not Track or a global privacy control signal, should the app still show the consent prompt? → A: No; the signal wins, the prompt is hidden, and analytics stays off with no choice offered.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See PracticeEnglish alongside all my other apps (Priority: P1)

As the site owner, I want PracticeEnglish's visits, language, and device data to appear in my Google Analytics account, so I can review all my apps in one place instead of using a separate report.

**Why this priority**: This is the whole reason for the change; without it nothing else matters.

**Independent Test**: With the owner's measurement configured, open the app; confirm a visit with the correct language and device class appears in the owner's Google Analytics account, under a property/stream identifiable as PracticeEnglish.

**Acceptance Scenarios**:

1. **Given** analytics is configured, **When** a learner opens the app, **Then** one visit is recorded in Google Analytics with interface language and device class.
2. **Given** the owner has other apps in the same account, **When** they view reports, **Then** PracticeEnglish data can be viewed and filtered separately from the other apps.
3. **Given** a learner reloads or navigates within the same tab session, **When** they do, **Then** the visit is not counted again.

---

### User Story 2 - Keep all the usage events I already had (Priority: P1)

As the site owner, I want the same usage insights as before (track-start source, resume usage, language changes, errors) available in Google Analytics, so the migration does not lose information.

**Why this priority**: Parity with spec 003 prevents a regression in what the owner can learn.

**Independent Test**: Run a scripted session covering every tracked action; confirm each expected event arrives in Google Analytics with correct labels and no extras.

**Acceptance Scenarios**:

1. **Given** audio begins playing, **When** it starts, **Then** a track-start event is recorded with source (scan, navigation, resume, repeat, next) and level, book type, unit, and track.
2. **Given** a learner activates "continue where I left off", **Then** a resume-used event is recorded.
3. **Given** a learner switches interface language, **Then** a language-changed event with the new language is recorded.
4. **Given** playback fails, a scan fails, or an uncaught error occurs, **Then** an error event with the fixed type label (and content identifiers for playback failures) is recorded, with duplicates suppressed per tab session.

---

### User Story 3 - Visitors' privacy is still respected (Priority: P2)

As a learner, I want the app to keep honouring my privacy signals and to be told clearly what is collected, so I can trust it even though a third-party service is now involved.

**Why this priority**: Google Analytics is more invasive by default than the previous setup, so safeguards are essential, but they do not deliver the owner's primary value.

**Independent Test**: Enable a Do Not Track / global privacy signal, or decline consent; confirm nothing is sent to Google and the app behaves identically.

**Acceptance Scenarios**:

1. **Given** the browser sends Do Not Track or a global privacy control signal, **When** the app loads, **Then** no data is sent to Google and the Google Analytics script is not loaded.
2. **Given** a learner has not granted consent, **When** they use the app, **Then** nothing is sent until they opt in (unless the owner has turned the consent prompt off in configuration).
3. **Given** a learner opens the privacy note, **Then** it names Google Analytics, states what is collected, and is available in every supported language.

---

### User Story 4 - Retire the old self-hosted analytics (Priority: P3)

As the site owner, I want the previous self-hosted collection and report removed once Google Analytics is live, so there is one source of truth and no leftover data collection.

**Why this priority**: Cleanup that follows the main migration; it reduces maintenance and avoids double counting.

**Independent Test**: After release, confirm the app sends events only to Google Analytics and the old collection and report endpoints no longer exist.

**Acceptance Scenarios**:

1. **Given** the migration is released, **When** a learner uses the app, **Then** no events are sent to the previous collector.
2. **Given** the old report endpoint, **When** requested, **Then** it is no longer available.

---

### Edge Cases

- The browser or an extension blocks Google Analytics: the app works identically, sends nothing, and shows no errors.
- Offline or Google unreachable: events are dropped silently without delaying playback or the UI.
- No measurement configuration present (local development, automated tests): nothing is sent; analytics stays off by default.
- Test and development traffic MUST NOT appear in the owner's production reports.
- Do Not Track or privacy signal turns on mid-session: no further events are sent.
- Error events MUST NOT include messages, stack traces, URLs, or free text.
- Page-view reporting from single-page navigation MUST NOT double count visits or leak page paths containing personal data (none exist today).
- Historical data from spec 003's collector is not migrated to Google Analytics.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST send its usage events (visit, track started, resume used, language changed, error) to the owner's Google Analytics account instead of the self-hosted collector.
- **FR-002**: The set of events, labels (track-start source; error type), and content identifiers (level, book type, unit, track) MUST match spec 003's definitions (003 FR-001, FR-002, FR-004, FR-005, FR-006, FR-008, FR-014), including its timing and de-duplication rules, unchanged.
- **FR-002a**: The system MUST disable all Google Analytics automatic and enhanced-measurement events (including automatic page views, scrolls, outbound clicks, site search, and file downloads) so that only the five defined events are sent. The visit event is sent explicitly once per tab session.
- **FR-003**: Every event MUST carry the interface language and device class so reports can be segmented by them.
- **FR-004**: Events MUST be distinguishable as belonging to PracticeEnglish so the owner can filter it from their other apps.
- **FR-005**: The system MUST NOT enable Google advertising features, remarketing, cross-site linking, or user-level identifiers, and MUST request anonymised IP handling.
- **FR-006**: The system MUST honour Do Not Track and global privacy control signals by loading nothing from Google and sending no events. When such a signal is present, the consent prompt MUST NOT be shown and no opt-in is offered.
- **FR-007**: The system MUST NOT send free text, error messages, account data, or any other personal data to Google Analytics.
- **FR-008**: Analytics MUST be off by default: with no Google Analytics configuration supplied, no script is loaded and nothing is sent. Automated tests and local development MUST NOT send data to production reports.
- **FR-009**: Analytics failures, blocking, or latency MUST NOT affect app functionality, load speed, or playback.
- **FR-010**: The privacy note MUST be updated, in all supported languages, to name Google Analytics as the service, say what is collected, and state that no personal data is deliberately gathered. Its wording MUST accurately reflect any cookies or identifiers Google Analytics sets.
- **FR-011**: The system MUST show a consent prompt to every visitor whose browser is not sending a Do Not Track or global privacy control signal (see FR-006), and MUST NOT load Google Analytics or send data until the learner opts in. A configuration flag MAY disable the prompt (treating consent as granted), and it MUST default to enabled. No region detection is performed. The learner's choice is remembered on the device and can be changed later.
- **FR-012**: The previous self-hosted collection and report components (spec 003) MUST be removed once Google Analytics is verified, so events are not sent to both places.
- **FR-013**: The project constitution MUST be amended to permit Google Analytics with the safeguards above, and spec 003's FR-007 MUST be marked superseded.
- **FR-014**: The owner MUST be able to read visits by language and device class, track-start source shares, resume usage, and error counts by type for a chosen time range directly in Google Analytics.

### Key Entities

- **Usage Event**: Unchanged from spec 003 (event type, language, device class, optional label, content identifiers), now delivered to Google Analytics.
- **Analytics Configuration**: The owner's Google Analytics identifier for PracticeEnglish; absent means analytics is off.
- **Consent State**: Whether the learner has opted in to analytics (unset, granted, or declined; remembered on the device); governs whether anything is sent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner can see PracticeEnglish alongside their other apps in one Google Analytics account, and filter it separately, in under one minute.
- **SC-002**: For a scripted session covering every tracked action, 100% of expected events appear in Google Analytics with correct labels and 0 unexpected events appear.
- **SC-003**: With a privacy signal, no consent, or analytics blocked, 0 requests are sent to Google and 100% of existing app journeys still pass their automated tests.
- **SC-004**: Learners see no more than 50 ms added to time-to-first-playback with analytics enabled.
- **SC-005**: After release, 0 events are sent to the previous collector, and its endpoints are gone.
- **SC-006**: The updated privacy note is present in 100% of supported languages.

## Assumptions

- The owner already has (or will create) a Google Analytics account and will supply the identifier for PracticeEnglish; creating it is outside this feature.
- Events keep the same names and labels as spec 003 so the owner's mental model carries over.
- Consent is required for every visitor (mixed-region audience) and shown as a minimal, accessible, translated prompt; the owner may later turn it off via configuration if their audience does not require it.
- GA4 does not offer an IP-anonymisation setting (it does not store full IPs), so FR-005's anonymised-IP request is satisfied by GA4's default behaviour.
- Do Not Track and global privacy control remain honoured even though Google does not require it, preserving spec 003 behaviour.
- Historical 003 data is not migrated; the old report is retired after Google Analytics is verified.
- Content-identifier dimensions (level, book type, unit, track) and language/device class are registered as reporting dimensions in Google Analytics by the owner as part of rollout.
- Existing scan, navigation, repeat/next, and resume features are only observed, not changed.
