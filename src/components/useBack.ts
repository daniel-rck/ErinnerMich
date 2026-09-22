import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * "Zurück" that works on a deep link too: `navigate(-1)` from the first
 * history entry (opened from a notification or a fresh PWA launch) leaves the
 * app or does nothing, so fall back to a fixed route there.
 */
export function useBack(fallback: string): () => void {
  const navigate = useNavigate();
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, fallback]);
}
