import { Component, type ErrorInfo, type ReactNode } from "react";
import { downloadExport } from "../lib/io/exportImport";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  exportFailed: boolean;
}

/**
 * Top-level error boundary. All data lives only in the local browser, so the
 * fallback offers a JSON backup export as escape hatch before reloading.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, exportFailed: false };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[app] Unbehandelter Render-Fehler:", error, info.componentStack);
  }

  handleExport = async (): Promise<void> => {
    try {
      await downloadExport();
      this.setState({ exportFailed: false });
    } catch (err) {
      console.error("[app] Backup-Export fehlgeschlagen:", err);
      this.setState({ exportFailed: true });
    }
  };

  render(): ReactNode {
    if (this.state.error === null) {
      return this.props.children;
    }
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Da ist etwas schiefgelaufen</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          ErinnerMich ist auf einen unerwarteten Fehler gestoßen. Deine Daten liegen weiterhin lokal
          in diesem Browser — du kannst sie vor dem Neuladen als JSON sichern.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-700"
          >
            Neu laden
          </button>
          <button
            type="button"
            onClick={() => void this.handleExport()}
            className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
          >
            Daten exportieren (JSON)
          </button>
        </div>
        {this.state.exportFailed && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Export fehlgeschlagen — Details in der Browser-Konsole.
          </p>
        )}
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{this.state.error.message}</p>
      </main>
    );
  }
}
