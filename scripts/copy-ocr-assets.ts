// Copies the self-hosted OCR assets into public/ocr/ so scanning makes no third-party requests.
// Worker and core come from node_modules; the "fast" English model is downloaded once (not in npm).
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const OUT = 'public/ocr'
const MODEL_URL = 'https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata'

mkdirSync(OUT, { recursive: true })
copyFileSync('node_modules/tesseract.js/dist/worker.min.js', `${OUT}/worker.min.js`)
// The .wasm.js build embeds the wasm binary, so the separate .wasm file is not needed.
copyFileSync('node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', `${OUT}/tesseract-core-simd-lstm.wasm.js`)

if (!existsSync(`${OUT}/eng.traineddata.gz`)) {
  const res = await fetch(MODEL_URL)
  if (!res.ok) throw new Error(`could not download ${MODEL_URL}: ${res.status}`)
  writeFileSync(`${OUT}/eng.traineddata.gz`, gzipSync(Buffer.from(await res.arrayBuffer())))
}
console.log(`OCR assets ready in ${OUT}/`)
