# Contract: Events Sent to Google Analytics

Every event is `gtag('event', <name>, <params>)`. Common parameters on all events:

| Param | Value | Notes |
|---|---|---|
| `app` | `practice-english` | Constant; filters this app from the owner's others (FR-004) |
| `ui_lang` | displayed language code | Custom dimension (event-scoped) |
| `device_class` | `mobile` \| `desktop` | Custom dimension (event-scoped) |

## Events

| GA event name | When | Extra params |
|---|---|---|
| `visit` | Once per tab session (and when consent is granted mid-session) | none |
| `track_started` | Audio `playing` after a pending start | `source` (`scan`/`navigation`/`resume`/`repeat`/`next`), `level`, `book_type`, `unit`, `track` |
| `resume_used` | Continue card activated | none |
| `language_changed` | Supported language chosen (changed value); `ui_lang` is the **new** language | none |
| `error` | Deduped per tab session | `error_type` (`playback-failure`/`scan-failure`/`unexpected`); plus `level`, `book_type`, `unit`, `track` only for `playback-failure` |

## Not sent

Free text, error messages, stack traces, URLs, user-agent strings, user IDs, any automatic event (`page_view`, `scroll`, `click`, `file_download`, `view_search_results`, video events). `send_page_view` is `false`; Enhanced measurement is disabled on the stream by the owner.

## `gtag('config')` flags

```text
send_page_view: false
allow_google_signals: false
allow_ad_personalization_signals: false
cookie_expires: 5184000   // 60 days
```

No `user_id`, no `linker`, no `ads_data_redaction` override needed.

## Owner-side GA setup (rollout, not code)

Custom dimensions (event scope): `ui_lang`, `device_class`, `source`, `error_type`, `level`, `book_type`, `unit`, `track`, `app`. Data stream: separate web stream for PracticeEnglish; Enhanced measurement off; event data retention 2 months; Google signals off.

## Reporting (FR-014)

Visits by language/device: `visit` count by `ui_lang`, `device_class`. Source share: `track_started` by `source`. Resume usage: `resume_used` count. Errors: `error` by `error_type`.
