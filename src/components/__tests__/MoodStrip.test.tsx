import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../ui/Toast'
import { MoodLogProvider } from '../MoodLog/MoodLogProvider'
import { MoodStrip } from '../MoodStrip'
import { listMoodEntriesInRange } from '../../lib/db/moodEntries'

function renderStrip(props: Parameters<typeof MoodStrip>[0] = {}) {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <MoodLogProvider>
          <MoodStrip {...props} />
        </MoodLogProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('MoodStrip', () => {
  it('rendert 5 Stimmungs-Buttons im expanded state', async () => {
    renderStrip()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Stimmung 1/ })).toBeInTheDocument()
    })
    for (let v = 1; v <= 5; v++) {
      expect(screen.getByRole('button', { name: new RegExp(`Stimmung ${v}`) })).toBeInTheDocument()
    }
  })

  it('schreibt einen MoodEntry beim Klick auf einen Smiley', async () => {
    renderStrip({ alwaysExpanded: true })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Stimmung 4/ })).toBeInTheDocument()
    })
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Stimmung 4/ }))
    })
    await waitFor(async () => {
      const entries = await listMoodEntriesInRange(0, Date.now() + 1000)
      expect(entries.length).toBe(1)
      expect(entries[0].mood).toBe(4)
    })
  })

  it('zeigt „Mit Notiz loggen" als Sekundär-Aktion', async () => {
    renderStrip()
    await waitFor(() => {
      expect(screen.getByText(/Mit Notiz loggen/)).toBeInTheDocument()
    })
  })
})
