import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadExport } from "../../lib/io/exportImport";
import { ErrorBoundary } from "../ErrorBoundary";

vi.mock("../../lib/io/exportImport", () => ({
  downloadExport: vi.fn().mockResolvedValue({}),
}));

function Bomb(): never {
  throw new Error("Kaboom");
}

beforeEach(() => {
  vi.mocked(downloadExport).mockClear();
});

describe("ErrorBoundary", () => {
  it("rendert Kinder, solange kein Fehler auftritt", () => {
    render(
      <ErrorBoundary>
        <p>Alles gut</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Alles gut")).toBeInTheDocument();
  });

  it("zeigt den Fallback mit Neu-laden- und Export-Aktion bei Render-Fehlern", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Da ist etwas schiefgelaufen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Neu laden" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Daten exportieren (JSON)" }));
    expect(vi.mocked(downloadExport)).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
