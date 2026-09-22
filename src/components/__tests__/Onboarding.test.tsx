import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Onboarding } from "../Onboarding";
import { ToastProvider } from "../ui/Toast";

describe("Onboarding", () => {
  it("reaches the starter picker after the last slide instead of crashing", async () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <Onboarding />
        </ToastProvider>
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Weiter" })); // welcome
    await screen.findByRole("heading", { name: "Deine Daten bleiben bei dir" });
    await userEvent.click(screen.getByRole("button", { name: "Weiter" })); // privacy
    await userEvent.click(await screen.findByRole("button", { name: "Später" })); // wellness
    await screen.findByRole("heading", { name: "Erinnerungen rechtzeitig erhalten" });
    await userEvent.click(screen.getByRole("button", { name: "Weiter" })); // notify
    expect(
      await screen.findByRole("heading", { name: "Erstes Habit anlegen?" }),
    ).toBeInTheDocument();
  });
});
