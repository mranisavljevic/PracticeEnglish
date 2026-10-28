export interface Reading {
  number: string
  confidence: number
}

export interface ReadingState {
  /** A number seen once, waiting for a second consecutive read to confirm it. */
  pending: string | null
  /** The last number confirmed by two consecutive confident reads. */
  shown: string | null
}

export const MIN_CONFIDENCE = 70

export const initialReading: ReadingState = { pending: null, shown: null }

/** Folds one OCR result into the state; only confident repeats of the same number are accepted. */
export function reduceReading(state: ReadingState, reading: Reading | null): ReadingState {
  if (!reading || reading.confidence < MIN_CONFIDENCE) return state
  if (state.pending === reading.number) return { pending: reading.number, shown: reading.number }
  return { ...state, pending: reading.number }
}
