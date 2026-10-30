import { afterEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import { dictionaries } from '../../src/i18n'
import { renderApp } from '../helpers/renderApp'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('privacy note', () => {
  it.each(['en', 'es'])('is in the footer, as readable text, in %s', (lang) => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([lang])
    renderApp('/')
    const text = dictionaries[lang]!['analytics.privacy']!
    expect(text).toBeTruthy()
    const note = within(screen.getByRole('contentinfo')).getByText(text)
    expect(note).toBeVisible()
    expect(note.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('differs between English and Spanish', () => {
    expect(dictionaries.es!['analytics.privacy']).not.toBe(dictionaries.en!['analytics.privacy'])
  })
})
