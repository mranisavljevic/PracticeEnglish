// Shared vocabulary and validation for usage events. The client imports types only.

export const EVENT_TYPES = ['visit', 'track_started', 'resume_used', 'language_changed', 'error'] as const
export const DEVICE_CLASSES = ['mobile', 'desktop'] as const
export const TRACK_SOURCES = ['scan', 'navigation', 'resume', 'repeat', 'next'] as const
export const ERROR_TYPES = ['playback-failure', 'scan-failure', 'unexpected'] as const
export const BOOK_TYPES = ['textbook', 'workbook'] as const

export type EventType = (typeof EVENT_TYPES)[number]
export type DeviceClass = (typeof DEVICE_CLASSES)[number]
export type TrackSource = (typeof TRACK_SOURCES)[number]
export type ErrorType = (typeof ERROR_TYPES)[number]
export type BookType = (typeof BOOK_TYPES)[number]

export interface UsageEvent {
  type: EventType
  lang: string
  device: DeviceClass
  label?: TrackSource | ErrorType
  level?: string
  bookType?: BookType
  unit?: string
  track?: string
}

export const MAX_BODY_BYTES = 1024

const LANG = /^[a-z]{2,3}$/
// Must not be just "-": that is how an unused slot is written in a blob key.
const ID = /^[a-z0-9][a-z0-9-]{0,39}$/
const FIELDS = ['type', 'lang', 'device', 'label', 'level', 'bookType', 'unit', 'track'] as const
const ID_FIELDS = ['level', 'bookType', 'unit', 'track'] as const

const has = <T extends string>(list: readonly T[], value: unknown): value is T => list.includes(value as T)

/** Returns the event when it is exactly the allowed shape, otherwise null. Nothing else passes through. */
export function validateEvent(input: unknown): UsageEvent | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null
  const raw = input as Record<string, unknown>
  if (JSON.stringify(raw).length > MAX_BODY_BYTES) return null
  if (Object.keys(raw).some((k) => !(FIELDS as readonly string[]).includes(k))) return null

  const { type, lang, device, label, level, bookType, unit, track } = raw
  if (!has(EVENT_TYPES, type) || !has(DEVICE_CLASSES, device)) return null
  if (typeof lang !== 'string' || !LANG.test(lang)) return null

  const labelAllowed = type === 'track_started' ? TRACK_SOURCES : type === 'error' ? ERROR_TYPES : null
  if (labelAllowed) {
    if (!has(labelAllowed, label)) return null
  } else if (label !== undefined) return null

  const needsIds = type === 'track_started' || (type === 'error' && label === 'playback-failure')
  if (needsIds) {
    if (!has(BOOK_TYPES, bookType)) return null
    for (const id of [level, unit, track]) if (typeof id !== 'string' || !ID.test(id)) return null
  } else if (ID_FIELDS.some((k) => raw[k] !== undefined)) return null

  const event: UsageEvent = { type, lang, device }
  if (label !== undefined) event.label = label as UsageEvent['label']
  if (needsIds) Object.assign(event, { level, bookType, unit, track })
  return event
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

/** `<day>/<type>~<lang>~<device>~<label>~<level>~<bookType>~<unit>~<track>/<uuid>`; `-` marks an unused slot. */
export function encodeKey(event: UsageEvent, date: string, uuid: string): string {
  const slots = [event.type, event.lang, event.device, event.label, event.level, event.bookType, event.unit, event.track]
  return `${date}/${slots.map((s) => s ?? '-').join('~')}/${uuid}`
}

export function decodeKey(key: string): { date: string; event: UsageEvent; uuid: string } | null {
  const parts = key.split('/')
  if (parts.length !== 3) return null
  const [date, dims, uuid] = parts as [string, string, string]
  if (!DAY.test(date) || !uuid) return null
  const slots = dims.split('~')
  if (slots.length !== 8) return null
  const [type, lang, device, label, level, bookType, unit, track] = slots.map((s) => (s === '-' ? undefined : s))
  const candidate: Record<string, unknown> = { type, lang, device, label, level, bookType, unit, track }
  for (const k of Object.keys(candidate)) if (candidate[k] === undefined) delete candidate[k]
  const event = validateEvent(candidate)
  return event ? { date, event, uuid } : null
}
