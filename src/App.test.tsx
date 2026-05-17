import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'

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

  it('zeigt die 4 Haupt-Nav-Slots: Heute, Stimmung, Routinen, Du', () => {
    render(<App />)
    expect(screen.getAllByRole('link', { name: /Heute/ }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /Stimmung/ }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /Routinen/ }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: /^Du$/ }).length).toBeGreaterThan(0)
  })

  it('hat den zentralen FAB als „Neu anlegen"-Button', () => {
    render(<App />)
    expect(
      screen.getAllByRole('button', { name: /Neu anlegen/ }).length,
    ).toBeGreaterThan(0)
  })
})
