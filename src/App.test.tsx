import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from './App'

describe('App', () => {
  it('zeigt die ErinnerMich-Wortmarke', () => {
    render(<App />)
    const all = screen.getAllByLabelText(/ErinnerMich/i)
    expect(all.length).toBeGreaterThan(0)
  })

  it('hat einen Dark-Mode-Toggle', () => {
    render(<App />)
    expect(
      screen.getByRole('button', { name: /Modus wechseln/i }),
    ).toBeInTheDocument()
  })
})
