import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs } from '../Tabs'

function Harness() {
  const [tab, setTab] = useState('a')
  return (
    <Tabs value={tab} onChange={setTab}>
      <Tabs.List ariaLabel="Beispiel">
        <Tabs.Trigger value="a">Eins</Tabs.Trigger>
        <Tabs.Trigger value="b">Zwei</Tabs.Trigger>
        <Tabs.Trigger value="c">Drei</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Panel value="a">Inhalt A</Tabs.Panel>
      <Tabs.Panel value="b">Inhalt B</Tabs.Panel>
      <Tabs.Panel value="c">Inhalt C</Tabs.Panel>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('renders tablist with correct ARIA', () => {
    render(<Harness />)
    expect(screen.getByRole('tablist', { name: 'Beispiel' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
  })

  it('switches panel on click', async () => {
    render(<Harness />)
    expect(screen.getByText('Inhalt A')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Zwei' }))
    expect(screen.getByText('Inhalt B')).toBeInTheDocument()
    expect(screen.queryByText('Inhalt A')).not.toBeInTheDocument()
  })

  it('navigates with arrow keys', async () => {
    render(<Harness />)
    const first = screen.getByRole('tab', { name: 'Eins' })
    first.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByText('Inhalt B')).toBeInTheDocument()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByText('Inhalt C')).toBeInTheDocument()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByText('Inhalt B')).toBeInTheDocument()
  })

  it('marks active tab with aria-selected', () => {
    render(<Harness />)
    expect(screen.getByRole('tab', { name: 'Eins' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Zwei' })).toHaveAttribute('aria-selected', 'false')
  })
})
