import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { vibrate } from './ui/Haptic'
import { useMoodLog } from './MoodLog/MoodLogProvider'
import { QuickCaptureSheet } from './QuickCaptureSheet'
import { LONG_PRESS_MS } from '../lib/design/gestures'

interface CenterFabProps {
  /**
   * When true, renders a compact pill (desktop side-nav variant) instead of
   * the elevated bottom-nav circle. Same long-press behavior.
   */
  variant?: 'circle' | 'pill'
}

export function CenterFab({ variant = 'circle' }: CenterFabProps) {
  const moodLog = useMoodLog()
  const [sheetOpen, setSheetOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)

  function startLongPress() {
    longPressFired.current = false
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      vibrate('tick')
      moodLog.open()
    }, LONG_PRESS_MS)
  }
  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }
  function onClick() {
    if (longPressFired.current) {
      longPressFired.current = false
      return
    }
    vibrate('tick')
    setSheetOpen(true)
  }

  if (variant === 'pill') {
    return (
      <>
        <button
          type="button"
          onClick={onClick}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          aria-label="Neu anlegen (lang drücken: Stimmung)"
          className={[
            'flex w-full items-center justify-center gap-2',
            'h-11 rounded-[var(--radius-md)]',
            'bg-[color:var(--color-brand-600)] text-[color:var(--color-text-on-brand)]',
            'shadow-[var(--elev-brand)]',
            'transition-[background-color] duration-[var(--motion-fast)] ease-[var(--motion-ease)]',
            'hover:bg-[color:var(--color-brand-700)] active:bg-[color:var(--color-brand-800)]',
          ].join(' ')}
        >
          <Plus size={18} aria-hidden />
          <span className="text-[length:var(--text-body)] font-semibold">Neu</span>
        </button>
        <QuickCaptureSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </>
    )
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={onClick}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        whileTap={{ scale: 0.92 }}
        aria-label="Neu anlegen (lang drücken: Stimmung)"
        className={[
          'inline-flex items-center justify-center',
          'h-14 w-14 -mt-3 rounded-full',
          'bg-gradient-to-br from-[color:var(--color-brand-500)] to-[color:var(--color-brand-700)]',
          'text-[color:var(--color-text-on-brand)]',
          'shadow-[var(--elev-brand)]',
          'transition-colors duration-[var(--motion-fast)]',
          'hover:brightness-110 active:brightness-95',
        ].join(' ')}
      >
        <Plus size={26} aria-hidden strokeWidth={2.4} />
      </motion.button>
      <QuickCaptureSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}
