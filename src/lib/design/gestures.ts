import type { MotionValue, PanInfo } from "framer-motion";
import { useMotionValue, useTransform } from "framer-motion";
import { useRef } from "react";
import type { HapticPattern } from "../../components/ui/Haptic";
import { vibrate } from "../../components/ui/Haptic";

export const SWIPE_THRESHOLD = 60;
export const LONG_PRESS_MS = 400;

export interface SwipeHandlers {
  x: MotionValue<number>;
  background: MotionValue<string>;
  onDragEnd: (_e: unknown, info: PanInfo) => void;
}

export interface UseSwipeActionsOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  threshold?: number;
  rightHaptic?: HapticPattern;
  leftHaptic?: HapticPattern;
  rightColor?: string;
  leftColor?: string;
}

/**
 * Wires horizontal pan -> swipe-right (complete) and swipe-left (reveal tray).
 * Caller passes `x` and `background` to a motion element via style/animate.
 */
export function useSwipeActions(options: UseSwipeActionsOptions): SwipeHandlers {
  const {
    onSwipeRight,
    onSwipeLeft,
    threshold = SWIPE_THRESHOLD,
    rightHaptic = "success",
    leftHaptic = "tick",
    rightColor = "var(--color-success-soft)",
    leftColor = "var(--color-warning-soft)",
  } = options;

  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-threshold * 2, -threshold / 2, 0, threshold / 2, threshold * 2],
    [leftColor, "transparent", "transparent", "transparent", rightColor],
  );

  const onDragEnd = (_e: unknown, info: PanInfo): void => {
    if (info.offset.x > threshold && onSwipeRight) {
      vibrate(rightHaptic);
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      vibrate(leftHaptic);
      onSwipeLeft();
    }
    x.set(0);
  };

  return { x, background, onDragEnd };
}

export interface UseLongPressOptions {
  onLongPress: () => void;
  onTap?: () => void;
  ms?: number;
  haptic?: HapticPattern | false;
}

export interface LongPressHandlers {
  onPointerDown: (_e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
}

/**
 * Distinguishes tap vs long-press by holding for >= ms. Fires haptic on commit.
 */
export function useLongPress(options: UseLongPressOptions): LongPressHandlers {
  const { onLongPress, onTap, ms = LONG_PRESS_MS, haptic = "tick" } = options;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const clear = (): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return {
    onPointerDown: () => {
      firedRef.current = false;
      clear();
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        if (haptic) vibrate(haptic);
        onLongPress();
      }, ms);
    },
    onPointerUp: () => {
      const fired = firedRef.current;
      clear();
      if (!fired && onTap) onTap();
    },
    onPointerLeave: () => {
      clear();
    },
    onPointerCancel: () => {
      clear();
    },
  };
}
