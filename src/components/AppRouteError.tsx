import { useState } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { downloadExport } from "../lib/io/exportImport";
import { RouteError } from "../lib/routing/RouteError.tsx";
import { Button } from "../lib/ui/Button.tsx";

/**
 * The router's ErrorBoundary: web-base's German `RouteError` (reload, a
 * missing chunk after a deploy, the way home) plus ErinnerMich's escape hatch.
 * All data lives only in this browser, so a crash offers a JSON backup before
 * the user reloads — the same offer as the last-resort `ErrorBoundary`.
 */
export function AppRouteError() {
  const error = useRouteError();
  const [exportFailed, setExportFailed] = useState(false);

  const handleExport = async () => {
    try {
      await downloadExport();
      setExportFailed(false);
    } catch (err) {
      console.error("[app] Backup-Export fehlgeschlagen:", err);
      setExportFailed(true);
    }
  };

  return (
    <>
      <RouteError />
      {isRouteErrorResponse(error) && error.status === 404 ? null : (
        <div className="-mt-10 flex flex-col items-center gap-2 px-4 pb-16 text-center">
          <Button variant="ghost" size="sm" onClick={() => void handleExport()}>
            Daten exportieren (JSON)
          </Button>
          {exportFailed ? (
            <p className="text-sm text-danger-fg">
              Export fehlgeschlagen — Details in der Browser-Konsole.
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}
