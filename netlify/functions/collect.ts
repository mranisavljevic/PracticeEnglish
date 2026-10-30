import { getStore } from '@netlify/blobs'
import { encodeKey, MAX_BODY_BYTES, validateEvent } from './lib/schema'

const base = { 'Cache-Control': 'no-store' }

// Deliberately reads nothing from the request except the body: no IP, user-agent or other header.
export default async function collect(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { ...base, Allow: 'POST' } })

  const body = await req.text()
  if (body.length > MAX_BODY_BYTES) return new Response(null, { status: 400, headers: base })

  let event
  try {
    event = validateEvent(JSON.parse(body))
  } catch {
    event = null
  }
  if (!event) return new Response(null, { status: 400, headers: base })

  const today = new Date().toISOString().slice(0, 10)
  await getStore('analytics').set(encodeKey(event, today, crypto.randomUUID()), '')
  return new Response(null, { status: 204, headers: base })
}
