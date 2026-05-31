export type NotificationSupport =
  | { state: "unsupported" }
  | { state: "supported"; permission: NotificationPermission };

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return { state: "unsupported" };
  }
  return { state: "supported", permission: Notification.permission };
}

export async function ensureNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  const support = getNotificationSupport();
  if (support.state === "unsupported") return "unsupported";
  if (support.permission === "granted" || support.permission === "denied") {
    return support.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * iOS Safari only delivers Web Push (Phase 7) when the app is installed to
 * the homescreen as a PWA. This detects "iPhone/iPad in non-standalone Safari".
 */
export function isIosWithoutStandalone(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in (globalThis as unknown as Document));
  if (!isIos) return false;
  const navAny = navigator as Navigator & { standalone?: boolean };
  if (navAny.standalone === true) return false;
  if (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches) {
    return false;
  }
  return true;
}
