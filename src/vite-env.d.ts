/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 measurement id (`G-…`). Unset in dev, tests and previews, which turns analytics off. */
  readonly VITE_GA_MEASUREMENT_ID?: string
  /** `off` skips the consent prompt and treats consent as granted. */
  readonly VITE_CONSENT_PROMPT?: string
}
