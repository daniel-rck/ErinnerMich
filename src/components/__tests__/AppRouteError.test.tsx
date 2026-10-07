import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadExport } from "../../lib/io/exportImport";
import { AppRouteError } from "../AppRouteError";

vi.mock("../../lib/io/exportImport", () => ({
  downloadExport: vi.fn<() => Promise<unknown>>().mockResolvedValue({}),
}));

function Bomb(): never {
  throw new Error("Kaboom");
}

beforeEach(() => {
  vi.mocked(downloadExport).mockClear();
});

describe("AppRouteError", () => {
  it("zeigt die deutsche Fehlerseite mit Neu-laden und Backup-Export", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const router = createMemoryRouter([
      { path: "/", Component: Bomb, ErrorBoundary: AppRouteError },
    ]);
    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Etwas ist schiefgelaufen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Neu laden" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Daten exportieren (JSON)" }));
    expect(vi.mocked(downloadExport)).toHaveBeenCalledTimes(1);
  });
});
