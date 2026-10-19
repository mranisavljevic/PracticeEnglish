import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderApp } from '../helpers/renderApp'
import { routes } from '../../src/router'

describe('app shell', () => {
  it('renders header, main and footer around pages', () => {
    renderApp('/')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('resolves the five routes', () => {
    const paths = routes[0]?.children?.map((r) => r.path ?? (r.index ? '/' : ''))
    expect(paths).toEqual(
      expect.arrayContaining(['/', 'b/:bookId', 'b/:bookId/u/:unitId', 'b/:bookId/u/:unitId/t/:trackId', '*']),
    )
  })

  it('unknown path renders NotFound with Home link', () => {
    renderApp('/does/not/exist')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/not found/i)
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
  })

  it('moves focus to the page h1 after navigation', async () => {
    const { router } = renderApp('/')
    await router.navigate('/nope')
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus())
  })
})
