import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'
import { writeWellnessToolsEnabled } from './lib/db/settings'

afterEach(() => {
  writeWellnessToolsEnabled(false)
})

describe('App shell', () => {
  it('zeigt die ErinnerMich-Wortmarke (Desktop Side-Nav)', () => {
    render(<App />)
    const all = screen.getAllByLabelText(/ErinnerMich/i)
    expect(all.length).toBeGreaterThan(0)
  })

  it('hat einen Theme-Toggle', () => {
    render(<App />)
    expect(screen.getAllByRole('button', { name: /Modus/i }).length).toBeGreaterThan(0)
  })

  it('zeigt per Default die 3 Haupt-Nav-Slots: Heute, Routinen, Du', () => {
    render(<App />)
    expect(screen.getAllByRole('link', { name: /Heute/ }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /Routinen/ }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /^Du$/ }).length).toBeGreaterThan(0)
    // Stimmung ist an wellnessToolsEnabled gekoppelt und per Default aus.
    expect(screen.queryByRole('link', { name: /Stimmung/ })).toBeNull()
  })

  it('zeigt Stimmung in der Nav, wenn wellnessToolsEnabled gesetzt ist', () => {
    writeWellnessToolsEnabled(true)
    render(<App />)
    expect(screen.getAllByRole('link', { name: /Stimmung/ }).length).toBeGreaterThan(0)
  })

  it('hat den zentralen FAB als „Neu anlegen“-Button', () => {
    render(<App />)
    expect(
      screen.getAllByRole('button', { name: /Neu anlegen/ }).length,
    ).toBeGreaterThan(0)
  })
})
