# Feature Specification: Anonymous Usage Analytics

**Feature Branch**: `003-anonymous-usage-analytics`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "I would like to add anonymous analytics events so I can see how many visitors I'm getting, how they use the app, and which language they're using the app in. I'm open to suggestions about the \"how they use the app\" part, but it'd be good to know if they're using it on mobile/desktop, and it'd also be great to know if people are scanning files vs navigating, and once they navigate are they using \"repeat\" and \"next\" buttons to continue, or are they picking different files on the file list menus. I'd also like to know if people use the \"continue where I left off\" entry point at all."

## Constitution Justification *(required by Technology & Content Constraints)*

The constitution forbids collecting personal data and requires a spec-level justification for any analytics or data leaving the device. This feature is justified as follows: the site owner needs aggregate insight into audience size and feature usage to decide what to improve. To stay within the constitution's intent, the feature sends only a small fixed set of coarse, non-identifying events; it never sends names, account data, persistent identifiers, IP-derived profiles, or free text; and it does not track individuals across visits or sites. Public catalog identifiers (level, book type, unit, track) are sent on track-start events because they describe the content, not the learner. If the plan cannot meet these limits, a constitution amendment is required instead.

## Clarifications

### Session 2026-10-29

- Q: How should the app decide whether a visitor counts as "mobile" or "desktop"? → A: Browser user-agent string, evaluated locally; only the resulting class is transmitted.
- Added (owner request, post-session): an "error" event with a fixed type label (playback-failure, scan-failure, unexpected), with no error messages or stack traces transmitted.
- Q: At what moment should a "track started" event be recorded? → A: When audio actually begins playing; a failed load or blocked play records nothing.
- Q: Should repeat/next/list picks record a separate "continue" event as well as "track started"? → A: No "continue" event; "track started" alone carries the source (scan, navigation, resume, repeat, next).
- Q: Which content details should a track-start event carry? → A: Level, book type, unit, and track (all public catalog identifiers); supersedes the earlier "coarse level/book-type only" assumption.
- Q: What should count as one "visit" for the visit event and the "don't count reloads again" rule? → A: One visit per browser tab session; reloads and in-app navigation don't recount, a new tab or reopened browser does.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See how many visitors and in which language (Priority: P1)

As the site owner, I want to know how many people visit the app, which interface language they are using, and whether they are on a phone or a desktop, so I can decide which languages and form factors deserve the most attention.

**Why this priority**: Audience size, language and device class are the core questions asked, and they are valuable on their own even if no other events exist.

**Independent Test**: Open the app with a phone-sized viewport in one language and a desktop-sized viewport in another; confirm that the owner's report shows two visits, each with the correct language and device class, and no personal identifiers.

**Acceptance Scenarios**:

1. **Given** a learner opens the app for the first time, **When** the home screen loads, **Then** one "visit" event is recorded including the interface language in use and a device class (mobile or desktop).
2. **Given** a learner changes the interface language, **When** the change is applied, **Then** subsequent events carry the new language.
3. **Given** a learner reloads or navigates within the app during one visit, **When** these actions occur, **Then** the visit is not counted again as a new visitor.

---

### User Story 2 - Understand how learners find audio: scan vs. navigate (Priority: P2)

As the site owner, I want to know whether learners start playing audio by scanning a code/icon or by navigating the level/book/unit lists, so I know whether the scan feature is worth investing in.

**Why this priority**: It directly measures adoption of the scan feature relative to browsing.

**Independent Test**: Start playback once via scanning and once via the lists; confirm the report shows one of each "playback start" source.

**Acceptance Scenarios**:

1. **Given** a learner starts a track via the scan feature, **When** playback begins, **Then** a "track started" event is recorded with source "scan".
2. **Given** a learner picks a track from the file list menus, **When** playback begins, **Then** a "track started" event is recorded with source "navigation".
3. **Given** a learner returns via the "continue where I left off" entry point, **When** playback begins, **Then** a "track started" event is recorded with source "resume".

---

### User Story 3 - Understand how learners continue practising (Priority: P3)

As the site owner, I want to know, once a learner is playing a track, whether they keep going using "repeat" and "next" or by picking other tracks from the lists, so I understand the practice flow and which controls matter.

**Why this priority**: It refines understanding of engagement but is less critical than audience and entry-point data.

**Independent Test**: Play a track, press repeat, press next, then pick a different track from a list; confirm the report shows one "track started" event each with source "repeat", "next", and "navigation" (plus the initial one).

**Acceptance Scenarios**:

1. **Given** a track is playing or finished, **When** the learner presses "repeat" and playback begins, **Then** a "track started" event with source "repeat" is recorded.
2. **Given** a track is playing or finished, **When** the learner presses "next" and playback begins, **Then** a "track started" event with source "next" is recorded.
3. **Given** a learner has played a track, **When** they pick a different track from the file lists, **Then** a "track started" event with source "navigation" is recorded.

---

### User Story 4 - Know whether "continue where I left off" is used (Priority: P3)

As the site owner, I want to know how often learners use the "continue where I left off" entry point, so I can judge whether the resume feature is valuable and visible enough.

**Why this priority**: A single, specific adoption signal; useful but narrow.

**Independent Test**: Use the resume entry point once; confirm a "resume used" event is reported, and that opening the app without using it records none.

**Acceptance Scenarios**:

1. **Given** a learner with a saved last-played track, **When** they activate "continue where I left off", **Then** a "resume used" event is recorded.
2. **Given** the resume entry point is shown but not activated, **When** the learner does something else, **Then** no "resume used" event is recorded.

---

### User Story 5 - Know when things break (Priority: P2)

As the site owner, I want to know when learners hit errors such as audio failing to play, so I can find and fix broken tracks or flows I would otherwise never hear about.

**Why this priority**: Errors are invisible to the owner today, and a broken track silently loses a learner.

**Independent Test**: Trigger a playback failure (e.g. a track whose audio cannot load); confirm the report shows one "error" event with type "playback-failure" and the track's content identifiers, and no "track started" event for it.

**Acceptance Scenarios**:

1. **Given** a learner selects a track whose audio fails to load or play, **When** the failure occurs, **Then** an "error" event with type "playback-failure" is recorded, carrying level, book type, unit, and track.
2. **Given** a scan attempt fails (e.g. the code or icon is not recognised or the scan feature errors), **When** the failure occurs, **Then** an "error" event with type "scan-failure" is recorded.
3. **Given** an uncaught application error occurs, **When** it is detected, **Then** an "error" event with type "unexpected" is recorded with no message or stack trace.
4. **Given** the same failure repeats many times in a row (e.g. a retry loop), **When** it recurs, **Then** at most one identical error event is recorded per tab session per error type and track.

---

### Edge Cases

- A playback failure records an "error" event and no "track started" event for that attempt.
- Error events MUST NOT include error messages, stack traces, URLs, or any free text; only the type label and, for playback failures, the content identifiers.

- The learner's browser blocks analytics, or has "Do Not Track"/global privacy signals enabled: the app MUST work identically, send nothing, and show no errors.
- The learner is offline or the analytics service is unreachable: events are dropped silently without delaying playback or the UI.
- A device is ambiguous (e.g. tablet, or desktop window resized to a narrow width): it is classified by the user-agent rule (see Device Class), so window size never changes the class and tablets follow whatever their user-agent declares.
- The user-agent string is missing, empty, or unrecognised: the device class defaults to "desktop".
- The interface language is one not yet supported and falls back to a default: the recorded language is the one actually displayed.
- Rapid repeated taps on "repeat"/"next": each real action is recorded, but duplicate events from a single tap are not.
- Automated tests and local development runs MUST NOT pollute the owner's production data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST record one "visit" event per browser tab session (a reload or in-app navigation within the same tab session does not count again; a new tab or reopened browser does), including interface language and device class (mobile or desktop). Visit state is held only for the life of the tab session and MUST NOT persist across sessions.
- **FR-002**: The system MUST record a "track started" event at the moment audio actually begins playing (not on tap or selection; a failed load or blocked play records nothing), labelled with exactly one source: scan, navigation (a pick from the level/book/unit file lists, whether first or later), resume, repeat, or next. The source describes the learner's action, not the page: reloading or navigating back/forward to a track page MUST NOT re-record a scan or resume arrival (such a later start is labelled "navigation").
- **FR-003**: *(Removed: a separate "continue" event is not recorded; repeat, next, and list picks are captured as sources of "track started" under FR-002.)*
- **FR-004**: The system MUST record a "resume used" event when the "continue where I left off" entry point is activated.
- **FR-005**: The system MUST record a "language changed" event when the learner switches interface language, including the new language.
- **FR-006**: Every event MUST carry the current interface language and device class.
- **FR-007**: The system MUST NOT collect or transmit personal data, free text, account data, or persistent per-person identifiers, and MUST NOT identify a learner across visits.
- **FR-008**: Every "track started" event, and every "playback-failure" error event, MUST include the content identifiers level, book type, unit, and track. These are public catalog identifiers and are the only content details sent; free text, search input, and anything about the learner MUST NOT be sent.
- **FR-009**: The system MUST honour browser "Do Not Track" / global privacy control signals by sending no events.
- **FR-010**: Analytics failures, blocking, or latency MUST NOT affect app functionality, load speed, or playback.
- **FR-011**: Events from automated tests and local development MUST be excluded from, or clearly separated from, production data. Analytics MUST be off by default: with no analytics endpoint configured, nothing is sent.
- **FR-012**: The owner MUST be able to view aggregated counts of visits, languages, device classes, track-start sources, resume usage, and error counts by type over a chosen time range.
- **FR-013**: The app MUST state, in a short accessible privacy note (plain text exposed to assistive technology, with sufficient contrast) translated into all supported languages, that anonymous usage statistics are collected and no personal data is gathered. The note covers the app's own collection only; the hosting provider's standard request logs are outside the app's control and are not described by it.
- **FR-014**: The system MUST record an "error" event when playback fails (playback-failure, with level, book type, unit, and track), when a scan attempt fails (scan-failure), or when an uncaught application error occurs (unexpected). Error events carry only the fixed type label and, for playback failures, the content identifiers; duplicates of the same type and track within one tab session MUST be suppressed.

### Key Entities

- **Usage Event**: A single anonymous record of something that happened. Attributes: event type (visit, track started, resume used, language changed, error), interface language, device class, optional label (track-start source, or error type: playback-failure, scan-failure, unexpected), content identifiers (level, book type, unit, track; present on track-start events and playback-failure error events), and a day-level timestamp (the UTC day, set by the collector; no time of day). Never linked to a person.
- **Device Class**: Mobile or desktop, determined once per visit by inspecting the browser's user-agent string on the device. Only the resulting class value is transmitted; the user-agent string itself, and any browser or OS detail, MUST NOT be sent or stored (FR-007).
- **Event Label**: A small fixed vocabulary: for track-start events the source (scan, navigation, resume, repeat, next); for error events the type (playback-failure, scan-failure, unexpected).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner can read total visits, split by language and device class, for any chosen date range from a single report.
- **SC-002**: For a scripted session covering every tracked action, 100% of expected events appear in the report with the correct labels, and 0 unexpected events appear.
- **SC-003**: The share of track starts by each source (scan, navigation, resume, repeat, next) can be read directly from the report without manual data processing.
- **SC-004**: Learners see no measurable change in time-to-first-playback (no more than 50 ms added) with analytics enabled.
- **SC-005**: With analytics blocked or the service unreachable, 100% of existing app journeys still pass their automated tests.
- **SC-006**: A review of the transmitted data confirms 0 personal data fields and 0 persistent per-person identifiers.

## Assumptions

- A third-party privacy-friendly, cookieless analytics service or a self-hosted equivalent will be used; the choice is deferred to planning, subject to FR-007 and FR-009.
- Because no personal data or persistent identifiers are used, a consent banner is not required; the short privacy note (FR-013) is sufficient. This should be revisited if the plan's chosen service uses cookies.
- "Visitor" is approximated by anonymous visit counts (one per tab session); exact unique-person counts are not required, and the same person returning in a new tab or session is counted again.
- Device class is mobile vs. desktop only; browser, OS, and screen size are out of scope. If the chosen analytics service records the user-agent or derives browser/OS on its own, the plan must disable that or pick a service that does not, to stay within FR-007.
- Tracking time spent listening and completion rate are out of scope for this version. Per-track popularity is derivable from the content identifiers on track-start events (FR-008), though a dedicated popularity view is not required.
- Suggested additional events beyond the request: "language changed" (included) and level, book type, unit, and track on track starts (included per FR-008).
- Existing scan, navigation, repeat/next, and resume features already exist (specs 001 and 002) and are only observed, not changed.
