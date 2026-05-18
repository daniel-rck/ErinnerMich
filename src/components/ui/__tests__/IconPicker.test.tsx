import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IconPicker } from '../IconPicker'

function Harness({ onChange }: { onChange?: (v: string) => void }) {
  const [icon, setIcon] = useState('⏰')
  return (
    <IconPicker
      value={icon}
      onChange={(v) => {
        setIcon(v)
        onChange?.(v)
      }}
    />
  )
}

describe('IconPicker', () => {
  it('rendert den Trigger mit dem aktuellen Symbol', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Symbol wählen' })).toBeInTheDocument()
    expect(screen.getByText('⏰')).toBeInTheDocument()
  })

  it('öffnet das Sheet beim Klick auf den Trigger', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Symbol wählen' }))
    expect(screen.getByRole('dialog', { name: /Symbol wählen/i })).toBeInTheDocument()
    expect(screen.getByRole('searchbox')).toBeInTheDocument()
  })

  it('filtert die Vorschläge bei Suche', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Symbol wählen' }))
    const search = screen.getByRole('searchbox')
    await userEvent.type(search, 'wasser')
    // 💧 sollte in den Vorschlägen sein
    expect(screen.getByRole('button', { name: 'Symbol 💧' })).toBeInTheDocument()
  })

  it('ruft onChange beim Klick auf ein Symbol', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Symbol wählen' }))
    await userEvent.click(screen.getByRole('button', { name: 'Symbol 💧' }))
    expect(onChange).toHaveBeenCalledWith('💧')
  })

  it('akzeptiert ein eigenes Emoji aus dem Custom-Feld', async () => {
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Symbol wählen' }))
    const customInput = screen.getByLabelText(/Eigenes Emoji/)
    await userEvent.type(customInput, '🦔')
    await userEvent.click(screen.getByRole('button', { name: 'Übernehmen' }))
    expect(onChange).toHaveBeenCalledWith('🦔')
  })

  it('zeigt eine Leer-Nachricht bei nicht gefundener Suche', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Symbol wählen' }))
    await userEvent.type(screen.getByRole('searchbox'), 'xyz123nichtgefunden')
    expect(screen.getByText(/Keine Symbole/)).toBeInTheDocument()
  })
})
