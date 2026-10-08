// The app's URLs. They are part of the product: installed PWAs, manifest
// shortcuts (`/new?kind=…`, `/?mood=open`), the share target (`/new`) and
// notification deep links (`/?notif=…`) point at them — never rename one.
export const ROUTES = {
  home: "/",
  mood: "/mood",
  library: "/library",
  you: "/you",
  // Legacy routes — kept for back-compat, still reachable.
  habits: "/habits",
  all: "/all",
  stats: "/stats",
  settings: "/settings",
  newReminder: "/new",
  editReminder: "/edit/:id",
  reminderDetail: "/detail/:id",
  tools: "/tools",
  toolSession: "/tools/:toolKey",
} as const;

export type RouteKey = keyof typeof ROUTES;
