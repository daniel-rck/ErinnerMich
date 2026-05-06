import type { ToolKey } from '../types'

export type ToolCategory = 'acute' | 'reflection'

export interface ToolDef {
  key: ToolKey
  title: string
  short: string
  blurb: string
  icon: string
  color: string
  category: ToolCategory
}

export const TOOLS: ToolDef[] = [
  {
    key: 'breathing',
    title: 'Atem-Bubble',
    short: 'Atmen',
    blurb: 'Geführte Atmung in 4-7-8 oder Box-Rhythmus.',
    icon: '🫁',
    color: 'sky',
    category: 'acute',
  },
  {
    key: 'grounding',
    title: '5-4-3-2-1 Erden',
    short: 'Erden',
    blurb: 'Erdung über die fünf Sinne — gegen Stress und Panik.',
    icon: '🌿',
    color: 'emerald',
    category: 'acute',
  },
  {
    key: 'gratitude',
    title: 'Dankbarkeits-Glas',
    short: 'Dankbar',
    blurb: 'Drei kleine Dinge, die heute gut waren.',
    icon: '🫙',
    color: 'amber',
    category: 'reflection',
  },
  {
    key: 'treasure',
    title: 'Schatzkiste',
    short: 'Schätze',
    blurb: 'Schöne Momente sammeln und an grauen Tagen ansehen.',
    icon: '💎',
    color: 'pink',
    category: 'reflection',
  },
  {
    key: 'worry',
    title: 'Sorgen-Box',
    short: 'Sorgen',
    blurb: 'Aufschreiben, ablegen, loslassen.',
    icon: '📦',
    color: 'slate',
    category: 'reflection',
  },
  {
    key: 'affirmation',
    title: 'Affirmation',
    short: 'Mantra',
    blurb: 'Dein Satz für heute.',
    icon: '✨',
    color: 'violet',
    category: 'reflection',
  },
]

export const TOOL_BY_KEY = Object.fromEntries(
  TOOLS.map((t) => [t.key, t] as const),
) as Record<ToolKey, ToolDef>

export const ACUTE_TOOL_KEYS: ToolKey[] = TOOLS.filter(
  (t) => t.category === 'acute',
).map((t) => t.key)
