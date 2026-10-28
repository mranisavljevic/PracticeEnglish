// Static audio server for local dev and e2e: HTTP range support + CORS.
import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { join, normalize, resolve } from 'node:path'

const ROOT = resolve(process.env.AUDIO_ROOT ?? 'tests/fixtures/audio')
const PORT = Number(process.env.PORT ?? 5174)

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Accept-Ranges', 'bytes')
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (url.pathname === '/health') {
    res.writeHead(200).end('ok')
    return
  }
  const file = normalize(join(ROOT, decodeURIComponent(url.pathname)))
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end()
    return
  }
  let size: number
  try {
    const st = statSync(file)
    if (!st.isFile()) throw new Error('not a file')
    size = st.size
  } catch {
    res.writeHead(404).end('not found')
    return
  }
  const type = file.endsWith('.mp3') ? 'audio/mpeg' : file.endsWith('.m4a') ? 'audio/mp4' : 'audio/ogg'
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]))
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1
    if (start > end || start >= size) {
      res.writeHead(416, { 'Content-Range': `bytes */${size}` }).end()
      return
    }
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': end - start + 1,
    })
    if (req.method === 'HEAD') res.end()
    else createReadStream(file, { start, end }).pipe(res)
    return
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size })
  if (req.method === 'HEAD') res.end()
  else createReadStream(file).pipe(res)
})

server.listen(PORT, () => console.log(`audio server on http://localhost:${PORT} (root ${ROOT})`))
