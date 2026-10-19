// Generates tiny silent MP3 fixtures (MPEG-2 Layer III, 22.05 kHz, 32 kbps, mono).
import { mkdirSync, writeFileSync } from 'node:fs'

const FRAME = Buffer.alloc(104)
FRAME.set([0xff, 0xf3, 0x40, 0xc0])

function mp3(seconds: number): Buffer {
  const frames = Math.ceil((seconds * 22050) / 576)
  return Buffer.concat(Array.from({ length: frames }, () => FRAME))
}

mkdirSync('tests/fixtures/audio/sample', { recursive: true })
for (const name of ['track-1', 'track-2', 'track-12a']) {
  writeFileSync(`tests/fixtures/audio/sample/${name}.mp3`, mp3(4))
}
