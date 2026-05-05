import { describe, expect, it, vi } from 'vitest'
import {
  emptyShortcutState,
  isTextInputTarget,
  matchShortcut,
  type Shortcut,
} from '../shortcuts'

const SHORTCUTS: Shortcut[] = [
  { combo: 'n', description: 'Neuer Reminder', action: vi.fn() },
  { combo: 'g t', description: 'Heute', action: vi.fn() },
  { combo: 'g h', description: 'Habits', action: vi.fn() },
  { combo: '?', description: 'Hilfe', action: vi.fn() },
]

describe('matchShortcut', () => {
  it('matched single-key combos sofort', () => {
    const { matched } = matchShortcut(emptyShortcutState(), 'n', SHORTCUTS, 0)
    expect(matched?.combo).toBe('n')
  })

  it('returnt buffer + null bei Prefix-Match', () => {
    const { next, matched } = matchShortcut(
      emptyShortcutState(),
      'g',
      SHORTCUTS,
      0,
    )
    expect(matched).toBeNull()
    expect(next.buffer).toEqual(['g'])
  })

  it('matched zweite Taste eines Chord', () => {
    const after = matchShortcut(emptyShortcutState(), 'g', SHORTCUTS, 0).next
    const { matched } = matchShortcut(after, 't', SHORTCUTS, 100)
    expect(matched?.combo).toBe('g t')
  })

  it('matched einen anderen Chord-Eintrag', () => {
    const after = matchShortcut(emptyShortcutState(), 'g', SHORTCUTS, 0).next
    const { matched } = matchShortcut(after, 'h', SHORTCUTS, 100)
    expect(matched?.combo).toBe('g h')
  })

  it('verwirft den Buffer nach Timeout', () => {
    const after = matchShortcut(emptyShortcutState(), 'g', SHORTCUTS, 0).next
    const { matched, next } = matchShortcut(after, 't', SHORTCUTS, 5_000)
    // 't' alone is not a shortcut, so no match
    expect(matched).toBeNull()
    expect(next.buffer).toEqual([])
  })

  it('ist case-insensitive', () => {
    const { matched } = matchShortcut(emptyShortcutState(), 'N', SHORTCUTS, 0)
    expect(matched?.combo).toBe('n')
  })

  it('akzeptiert ?', () => {
    const { matched } = matchShortcut(emptyShortcutState(), '?', SHORTCUTS, 0)
    expect(matched?.combo).toBe('?')
  })

  it('clearet den Buffer bei Nicht-Match', () => {
    const after = matchShortcut(emptyShortcutState(), 'x', SHORTCUTS, 0)
    expect(after.next.buffer).toEqual([])
  })
})

describe('isTextInputTarget', () => {
  it('erkennt input/textarea/select', () => {
    expect(isTextInputTarget(document.createElement('input'))).toBe(true)
    expect(isTextInputTarget(document.createElement('textarea'))).toBe(true)
    expect(isTextInputTarget(document.createElement('select'))).toBe(true)
  })

  it('erkennt contenteditable Elemente', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    expect(isTextInputTarget(div)).toBe(true)
  })

  it('lehnt button + null ab', () => {
    expect(isTextInputTarget(document.createElement('button'))).toBe(false)
    expect(isTextInputTarget(null)).toBe(false)
  })
})
