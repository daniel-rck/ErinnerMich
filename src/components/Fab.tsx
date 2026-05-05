import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Bell, Flame, Smile } from 'lucide-react'
import { vibrate } from './ui/Haptic'

const LONG_PRESS_MS = 400

export function Fab() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFired = useRef(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function startLongPress() {
    longPressFired.current = false
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true
      vibrate('tick')
      setOpen(true)
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
    if (open) {
      setOpen(false)
      return
    }
    navigate('/new?kind=reminder')
  }

  function pick(target: string) {
    setOpen(false)
    navigate(target)
  }

  return (
    <div
      ref={containerRef}
      className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 sm:bottom-6 sm:hidden"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 bottom-16 flex flex-col items-end gap-2"
          >
            <FabMenuItem
              icon={<Smile size={16} />}
              label="Mood loggen"
              onClick={() => pick('/new?kind=mood')}
            />
            <FabMenuItem
              icon={<Flame size={16} />}
              label="Neuer Habit"
              onClick={() => pick('/new?kind=habit')}
            />
            <FabMenuItem
              icon={<Bell size={16} />}
              label="Neue Erinnerung"
              onClick={() => pick('/new?kind=reminder')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={onClick}
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        whileTap={{ scale: 0.92 }}
        aria-label="Neuer Eintrag (lang drücken für Optionen)"
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 hover:bg-brand-700"
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
          <Plus size={24} />
        </motion.span>
      </motion.button>
    </div>
  )
}

function FabMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-md hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      {icon}
      {label}
    </button>
  )
}
