import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import { renderApp } from '../helpers/renderApp'

describe('Home', () => {
  it('groups books by level with title and type', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { level: 2, name: 'Level 1' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Level 2' })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Book A Textbook/ })
    expect(link).toHaveAttribute('href', '/b/book-a')
    expect(within(link).getByText('Textbook')).toBeInTheDocument()
    expect(within(screen.getByRole('link', { name: /Book B Workbook/ })).getByText('Workbook')).toBeInTheDocument()
  })
})

describe('Book page', () => {
  it('lists units and links to them', () => {
    renderApp('/b/book-a')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Book A Textbook')
    expect(screen.getByRole('link', { name: /Hello/ })).toHaveAttribute('href', '/b/book-a/u/unit-1')
    expect(screen.getByRole('link', { name: /Goodbye/ })).toHaveAttribute('href', '/b/book-a/u/unit-2')
  })

  it('Back goes to the parent path', () => {
    renderApp('/b/book-a')
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/')
  })

  it('unknown book renders NotFound', () => {
    renderApp('/b/nope')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/not found/i)
  })
})

describe('Unit page', () => {
  it('lists tracks by printed label, verbatim', () => {
    renderApp('/b/book-a/u/unit-1')
    expect(screen.getByRole('link', { name: /Track 12a/ })).toHaveAttribute('href', '/b/book-a/u/unit-1/t/t-12a')
    expect(screen.getByRole('link', { name: /Track 1$/ })).toHaveAttribute('href', '/b/book-a/u/unit-1/t/t-1')
    expect(screen.getByText('12a')).toBeInTheDocument()
  })

  it('Back goes to the book', () => {
    renderApp('/b/book-a/u/unit-1')
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/b/book-a')
  })

  it('unknown unit renders NotFound', () => {
    renderApp('/b/book-a/u/nope')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/not found/i)
  })
})
