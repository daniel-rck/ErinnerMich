import type { CategoryKey } from "./types";

export interface CategoryClasses {
  borderL: string;
  bg: string;
  text: string;
  ring: string;
  iconBg: string;
}

const CATEGORY_TO_TONE: Record<CategoryKey, keyof typeof TONE_CLASSES> = {
  plant: "lime",
  health: "rose",
  fitness: "lime",
  mind: "sky",
  social: "pink",
  home: "amber",
  work: "indigo",
  finance: "blue",
  auto: "slate",
  season: "orange",
  expiry: "amber",
  inventory: "stone",
  mood: "violet",
  other: "zinc",
};

const TONE_CLASSES = {
  lime: {
    borderL: "border-l-lime-500",
    bg: "bg-lime-50 dark:bg-lime-950/30",
    text: "text-lime-800 dark:text-lime-200",
    ring: "stroke-lime-500",
    iconBg: "bg-lime-100 dark:bg-lime-950/50",
  },
  rose: {
    borderL: "border-l-rose-500",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-800 dark:text-rose-200",
    ring: "stroke-rose-500",
    iconBg: "bg-rose-100 dark:bg-rose-950/50",
  },
  sky: {
    borderL: "border-l-sky-500",
    bg: "bg-sky-50 dark:bg-sky-950/30",
    text: "text-sky-800 dark:text-sky-200",
    ring: "stroke-sky-500",
    iconBg: "bg-sky-100 dark:bg-sky-950/50",
  },
  pink: {
    borderL: "border-l-pink-500",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    text: "text-pink-800 dark:text-pink-200",
    ring: "stroke-pink-500",
    iconBg: "bg-pink-100 dark:bg-pink-950/50",
  },
  amber: {
    borderL: "border-l-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-800 dark:text-amber-200",
    ring: "stroke-amber-500",
    iconBg: "bg-amber-100 dark:bg-amber-950/50",
  },
  indigo: {
    borderL: "border-l-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    text: "text-indigo-800 dark:text-indigo-200",
    ring: "stroke-indigo-500",
    iconBg: "bg-indigo-100 dark:bg-indigo-950/50",
  },
  blue: {
    borderL: "border-l-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-800 dark:text-blue-200",
    ring: "stroke-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-950/50",
  },
  slate: {
    borderL: "border-l-slate-500",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-200",
    ring: "stroke-slate-500",
    iconBg: "bg-slate-100 dark:bg-slate-800/60",
  },
  orange: {
    borderL: "border-l-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-800 dark:text-orange-200",
    ring: "stroke-orange-500",
    iconBg: "bg-orange-100 dark:bg-orange-950/50",
  },
  stone: {
    borderL: "border-l-stone-500",
    bg: "bg-stone-50 dark:bg-stone-900/40",
    text: "text-stone-700 dark:text-stone-200",
    ring: "stroke-stone-500",
    iconBg: "bg-stone-100 dark:bg-stone-800/60",
  },
  violet: {
    borderL: "border-l-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    text: "text-violet-800 dark:text-violet-200",
    ring: "stroke-violet-500",
    iconBg: "bg-violet-100 dark:bg-violet-950/50",
  },
  zinc: {
    borderL: "border-l-zinc-500",
    bg: "bg-zinc-50 dark:bg-zinc-900/40",
    text: "text-zinc-700 dark:text-zinc-200",
    ring: "stroke-zinc-500",
    iconBg: "bg-zinc-100 dark:bg-zinc-800/60",
  },
} as const satisfies Record<string, CategoryClasses>;

export function categoryClasses(category: CategoryKey): CategoryClasses {
  const tone = CATEGORY_TO_TONE[category] ?? "zinc";
  return TONE_CLASSES[tone];
}
