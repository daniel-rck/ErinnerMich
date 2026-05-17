import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FormField } from '../FormField'
import { Input } from '../Input'

describe('FormField', () => {
  it('associates label with input via htmlFor/id', () => {
    render(
      <FormField label="Titel">
        <Input placeholder="z.B. Mama anrufen" />
      </FormField>,
    )
    const input = screen.getByLabelText('Titel')
    expect(input).toBeInTheDocument()
  })

  it('renders hint and wires aria-describedby', () => {
    render(
      <FormField label="Titel" hint="Wähle einen kurzen Namen">
        <Input />
      </FormField>,
    )
    const input = screen.getByLabelText('Titel')
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    const hint = describedBy ? document.getElementById(describedBy) : null
    expect(hint).toHaveTextContent('Wähle einen kurzen Namen')
  })

  it('renders error and sets aria-invalid', () => {
    render(
      <FormField label="Titel" error="Pflichtfeld">
        <Input />
      </FormField>,
    )
    const input = screen.getByLabelText('Titel')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Pflichtfeld')).toBeInTheDocument()
  })

  it('shows required marker', () => {
    render(
      <FormField label="Titel" required>
        <Input />
      </FormField>,
    )
    expect(screen.getByText('*', { exact: false })).toBeInTheDocument()
  })

  it('shows optional marker when not required', () => {
    render(
      <FormField label="Notiz" optional>
        <Input />
      </FormField>,
    )
    expect(screen.getByText(/optional/i)).toBeInTheDocument()
  })
})
