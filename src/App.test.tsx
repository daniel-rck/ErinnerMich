import { render, screen, waitFor } from "@testing-library/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { writeLandingTab, writeWellnessToolsEnabled } from "./lib/db/settings";
import { routes } from "./lib/router";

let router: ReturnType<typeof createBrowserRouter> | undefined;

/** Mounts the app the way main.tsx does, at the current window location. */
function renderApp() {
  router = createBrowserRouter(routes);
  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  router?.dispose();
  router = undefined;
  writeWellnessToolsEnabled(false);
  window.history.replaceState(null, "", "/");
});

describe("App shell", () => {
  it("zeigt die ErinnerMich-Wortmarke (Desktop Side-Nav)", () => {
    renderApp();
    const all = screen.getAllByLabelText(/ErinnerMich/i);
    expect(all.length).toBeGreaterThan(0);
  });

  it("hat einen Theme-Toggle", () => {
    renderApp();
    expect(screen.getAllByRole("button", { name: /Modus/i }).length).toBeGreaterThan(0);
  });

  it("zeigt per Default die 3 Haupt-Nav-Slots: Heute, Routinen, Du", () => {
    renderApp();
    expect(screen.getAllByRole("link", { name: /Heute/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Routinen/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /^Du$/ }).length).toBeGreaterThan(0);
    // Stimmung ist an wellnessToolsEnabled gekoppelt und per Default aus.
    expect(screen.queryByRole("link", { name: /Stimmung/ })).toBeNull();
  });

  it("zeigt Stimmung in der Nav, wenn wellnessToolsEnabled gesetzt ist", () => {
    writeWellnessToolsEnabled(true);
    renderApp();
    expect(screen.getAllByRole("link", { name: /Stimmung/ }).length).toBeGreaterThan(0);
  });

  it("hat den zentralen FAB als „Neu anlegen“-Button", () => {
    renderApp();
    expect(screen.getAllByRole("button", { name: /Neu anlegen/ }).length).toBeGreaterThan(0);
  });

  it("öffnet beim Start die gewählte Standard-Startseite", async () => {
    writeLandingTab("habits");
    renderApp();
    await waitFor(() => expect(window.location.pathname).toBe("/library"));
  });

  it("zeigt eine 404-Seite für unbekannte Pfade – innerhalb der App-Shell", () => {
    window.history.replaceState(null, "", "/gibt-es-nicht");
    renderApp();
    expect(screen.getByRole("heading", { name: "Seite nicht gefunden" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Heute/ }).length).toBeGreaterThan(0);
  });

  it("öffnet alte Deep-Links wie /settings weiterhin", () => {
    window.history.replaceState(null, "", "/settings");
    renderApp();
    expect(screen.queryByRole("heading", { name: "Seite nicht gefunden" })).toBeNull();
  });
});
