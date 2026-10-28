import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderApp } from '../helpers/renderApp'

interface Env {
  getUserMedia?: boolean
  coarse?: boolean
  devices?: Array<{ kind: string }> | 'unsupported'
}

function setup({ getUserMedia = true, coarse = true, devices = [{ kind: 'videoinput' }] }: Env = {}) {
  const mediaDevices: Record<string, unknown> = {}
  if (getUserMedia) mediaDevices.getUserMedia = vi.fn()
  if (devices !== 'unsupported') mediaDevices.enumerateDevices = vi.fn(async () => devices)
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: mediaDevices })
  window.matchMedia = vi.fn((query: string) => ({
    matches: coarse && query === '(pointer: coarse)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as never
}

const button = () => screen.queryByRole('button', { name: 'Scan audio icon' })

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
})
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('ScanButton availability', () => {
  it('is shown on a touch device with a camera', async () => {
    setup()
    renderApp('/b/book-a')
    expect(await screen.findByRole('button', { name: 'Scan audio icon' })).toBeInTheDocument()
  })

  it('is shown when enumerateDevices is unsupported', async () => {
    setup({ devices: 'unsupported' })
    renderApp('/b/book-a')
    expect(await screen.findByRole('button', { name: 'Scan audio icon' })).toBeInTheDocument()
  })

  it('is hidden without getUserMedia', async () => {
    setup({ getUserMedia: false })
    renderApp('/b/book-a')
    await screen.findByRole('heading', { level: 1 })
    expect(button()).not.toBeInTheDocument()
  })

  it('is hidden without a coarse pointer', async () => {
    setup({ coarse: false })
    renderApp('/b/book-a')
    await screen.findByRole('heading', { level: 1 })
    expect(button()).not.toBeInTheDocument()
  })

  it('is hidden when no video input is listed', async () => {
    setup({ devices: [{ kind: 'audioinput' }] })
    renderApp('/b/book-a')
    await waitFor(() => expect(navigator.mediaDevices.enumerateDevices).toHaveBeenCalled())
    await screen.findByRole('heading', { level: 1 })
    expect(button()).not.toBeInTheDocument()
  })

  it('also appears on unit pages but never on Home or the book list', async () => {
    setup()
    const { router } = renderApp('/')
    await screen.findByRole('heading', { level: 1 })
    expect(button()).not.toBeInTheDocument()
    await router.navigate('/b/book-a/u/unit-1')
    expect(await screen.findByRole('button', { name: 'Scan audio icon' })).toBeInTheDocument()
  })
})
