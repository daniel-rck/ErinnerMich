import { useReducedMotion } from 'framer-motion'
import type { Transition, Variants } from 'framer-motion'

export const SPRING_SOFT: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
  mass: 0.8,
}

export const SPRING_SNAPPY: Transition = {
  type: 'spring',
  stiffness: 480,
  damping: 28,
  mass: 0.7,
}

export const EASE_BASE: Transition = {
  duration: 0.24,
  ease: [0.2, 0, 0, 1],
}

export const EASE_FAST: Transition = {
  duration: 0.14,
  ease: [0.2, 0, 0, 1],
}

export const FADE_UP: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: EASE_BASE },
}

export const SCALE_IN: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: SPRING_SOFT },
}

export const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

export const MOTION = {
  fadeUp: FADE_UP,
  scaleIn: SCALE_IN,
  staggerContainer: STAGGER_CONTAINER,
  springSoft: SPRING_SOFT,
  springSnappy: SPRING_SNAPPY,
  easeBase: EASE_BASE,
  easeFast: EASE_FAST,
} as const

/**
 * Returns motion props that respect prefers-reduced-motion.
 * If reduced motion is preferred, returns an empty object so animations no-op.
 */
export function useMotionVariants(variants: Variants): Variants {
  const reduced = useReducedMotion()
  if (reduced) {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1 },
    }
  }
  return variants
}
