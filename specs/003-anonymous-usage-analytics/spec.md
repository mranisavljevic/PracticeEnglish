# Feature Specification: Anonymous Usage Analytics

**Feature Branch**: `003-anonymous-usage-analytics`

**Created**: 2026-10-29

**Status**: Draft

**Input**: User description: "I would like to add anonymous analytics events so I can see how many visitors I'm getting, how they use the app, and which language they're using the app in. I'm open to suggestions about the \"how they use the app\" part, but it'd be good to know if they're using it on mobile/desktop, and it'd also be great to know if people are scanning files vs navigating, and once they navigate are they using \"repeat\" and \"next\" buttons to continue, or are they picking different files on the file list menus. I'd also like to know if people use the \"continue where I left off\" entry point at all."

## Constitution Justification *(required by Technology & Content Constraints)*

The constitution forbids collecting personal data and requires a spec-level justification for any analytics or data leaving the device. This feature is justified as follows: the site owner needs aggregate insight into audience size and feature usage to decide what to improve. To stay within the constitution's intent, the feature sends only a small fixed set of coarse, non-identifying events; it never sends names, account data, persistent identifiers, IP-derived profiles, free text, or specific track titles; and it does not track individuals across visits or sites. If the plan cannot meet these limits, a constitution amendment is required instead.

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

**Independent Test**: Play a track, press repeat, press next, then pick a different track from a list; confirm the report shows one event of each continuation type.

**Acceptance Scenarios**:

1. **Given** a track is playing or finished, **When** the learner presses "repeat", **Then** a "continue" event with type "repeat" is recorded.
2. **Given** a track is playing or finished, **When** the learner presses "next", **Then** a "continue" event with type "next" is recorded.
3. **Given** a learner has played a track, **When** they pick a different track from the file lists, **Then** a "continue" event with type "pick-from-list" is recorded.

---

### User Story 4 - Know whether "continue where I left off" is used (Priority: P3)

As the site owner, I want to know how often learners use the "continue where I left off" entry point, so I can judge whether the resume feature is valuable and visible enough.

**Why this priority**: A single, specific adoption signal; useful but narrow.

**Independent Test**: Use the resume entry point once; confirm a "resume used" event is reported, and that opening the app without using it records none.

**Acceptance Scenarios**:

1. **Given** a learner with a saved last-played track, **When** they activate "continue where I left off", **Then** a "resume used" event is recorded.
2. **Given** the resume entry point is shown but not activated, **When** the learner does something else, **Then** no "resume used" event is recorded.

---

### Edge Cases

- The learner's browser blocks analytics, or has "Do Not Track"/global privacy signals enabled: the app MUST work identically, send nothing, and show no errors.
- The learner is offline or the analytics service is unreachable: events are dropped silently without delaying playback or the UI.
- A device is ambiguous (e.g. tablet, or desktop window resized to a narrow width): it is classified consistently by a single documented rule.
- The interface language is one not yet supported and falls back to a default: the recorded language is the one actually displayed.
- Rapid repeated taps on "repeat"/"next": each real action is recorded, but duplicate events from a single tap are not.
- Automated tests and local development runs MUST NOT pollute the owner's production data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST record one "visit" event per visit, including interface language and device class (mobile or desktop).
- **FR-002**: The system MUST record a "track started" event whenever playback of a track begins, labelled with its source: scan, navigation, or resume.
- **FR-003**: The system MUST record a "continue" event whenever a learner proceeds after a track, labelled repeat, next, or pick-from-list.
- **FR-004**: The system MUST record a "resume used" event when the "continue where I left off" entry point is activated.
- **FR-005**: The system MUST record a "language changed" event when the learner switches interface language, including the new language.
- **FR-006**: Every event MUST carry the current interface language and device class.
- **FR-007**: The system MUST NOT collect or transmit personal data, free text, account data, or persistent per-person identifiers, and MUST NOT identify a learner across visits.
- **FR-008**: The system MUST NOT transmit track titles or other content identifiers beyond the coarse level/book-type needed to interpret usage; [assumed: level and book type are permitted, individual track identity is not].
- **FR-009**: The system MUST honour browser "Do Not Track" / global privacy control signals by sending no events.
- **FR-010**: Analytics failures, blocking, or latency MUST NOT affect app functionality, load speed, or playback.
- **FR-011**: Events from automated tests and local development MUST be excluded from, or clearly separated from, production data.
- **FR-012**: The owner MUST be able to view aggregated counts of visits, languages, device classes, track-start sources, continuation types, and resume usage over a chosen time range.
- **FR-013**: The app MUST state, in a short accessible privacy note translated into all supported languages, that anonymous usage statistics are collected and no personal data is gathered.

### Key Entities

- **Usage Event**: A single anonymous record of something that happened. Attributes: event type (visit, track started, continue, resume used, language changed), interface language, device class, optional label (source or continuation type), and timestamp. Never linked to a person.
- **Device Class**: Mobile or desktop, determined by one consistent rule.
- **Event Label**: A small fixed vocabulary distinguishing track-start sources (scan, navigation, resume) and continuation types (repeat, next, pick-from-list).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The owner can read total visits, split by language and device class, for any chosen date range from a single report.
- **SC-002**: For a scripted session covering every tracked action, 100% of expected events appear in the report with the correct labels, and 0 unexpected events appear.
- **SC-003**: The share of track starts by scan, navigation and resume, and of continuations by repeat, next and list picks, can be read directly from the report without manual data processing.
- **SC-004**: Learners see no measurable change in time-to-first-playback (no more than 50 ms added) with analytics enabled.
- **SC-005**: With analytics blocked or the service unreachable, 100% of existing app journeys still pass their automated tests.
- **SC-006**: A review of the transmitted data confirms 0 personal data fields and 0 persistent per-person identifiers.

## Assumptions

- A third-party privacy-friendly, cookieless analytics service or a self-hosted equivalent will be used; the choice is deferred to planning, subject to FR-007 and FR-009.
- Because no personal data or persistent identifiers are used, a consent banner is not required; the short privacy note (FR-013) is sufficient. This should be revisited if the plan's chosen service uses cookies.
- "Visitor" is approximated by anonymous visit counts; exact unique-person counts are not required and may be approximate.
- Device class is mobile vs. desktop only; browser, OS, and screen size are out of scope.
- Tracking time spent listening, completion rate, and per-track popularity are out of scope for this version.
- Suggested additional events beyond the request: "language changed" (included) and book level/type on track starts (included as coarse context).
- Existing scan, navigation, repeat/next, and resume features already exist (specs 001 and 002) and are only observed, not changed.
