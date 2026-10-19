import { describe, it, expect, vi } from 'vitest'
import { createTranslator, getLocales } from '../../src/i18n'
import { readdirSync } from 'node:fs'

const dicts = {
  en: { 'a.hello': 'Hello {name}', 'a.only': 'Only English' },
  es: { 'a.hello': 'Hola {name}' },
}

describe('t()', () => {
  it('looks up keys and interpolates', () => {
    expect(createTranslator('es', dicts)('a.hello', { name: 'Ana' })).toBe('Hola Ana')
    expect(createTranslator('en', dicts)('a.hello', { name: 'Ana' })).toBe('Hello Ana')
  })

  it('falls back to English for a key missing in the locale', () => {
    expect(createTranslator('es', dicts)('a.only')).toBe('Only English')
  })

  it('returns the key when missing everywhere and warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(createTranslator('es', dicts)('zzz')).toBe('zzz')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('discovers one locale per file with nativeName', () => {
    const files = readdirSync('src/locales').filter((f) => f.endsWith('.json'))
    const locales = getLocales()
    expect(locales.map((l) => l.code).sort()).toEqual(files.map((f) => f.replace('.json', '')).sort())
    expect(locales.find((l) => l.code === 'es')?.nativeName).toBe('Español')
    expect(locales.find((l) => l.code === 'en')?.nativeName).toBe('English')
  })
})
