export const STREAK_MILESTONES = [7, 30, 100, 365] as const;

export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

export function isMilestone(streak: number): streak is StreakMilestone {
  return (STREAK_MILESTONES as readonly number[]).includes(streak);
}

export function nextMilestone(streak: number): StreakMilestone | null {
  for (const m of STREAK_MILESTONES) {
    if (m > streak) return m;
  }
  return null;
}
