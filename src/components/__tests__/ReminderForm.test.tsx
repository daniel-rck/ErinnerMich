import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Reminder } from "../../lib/types";
import { ReminderForm } from "../ReminderForm";
import { ConfirmProvider } from "../ui/Confirm";
import { ToastProvider } from "../ui/Toast";

function renderForm(onSaved = vi.fn<(r: Reminder) => void>()) {
  render(
    <MemoryRouter>
      <ToastProvider>
        <ConfirmProvider>
          <ReminderForm kind="reminder" onSaved={onSaved} />
        </ConfirmProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
  return onSaved;
}

describe("ReminderForm", () => {
  it("survives deselecting every weekday and refuses to save it", async () => {
    const onSaved = renderForm();
    await userEvent.type(screen.getByRole("textbox", { name: "Titel" }), "Müll");
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Art der Wiederholung" }),
      "weekly",
    );
    await userEvent.click(screen.getByRole("button", { name: "Mo" }));
    // The preview explains instead of crashing into the error boundary.
    expect(screen.getAllByText("Mindestens einen Wochentag wählen.").length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("button", { name: "Anlegen" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Mindestens einen Wochentag wählen.");
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("keeps the last daily time", () => {
    renderForm();
    expect(screen.queryByRole("button", { name: /entfernen/ })).toBeNull();
  });
});
