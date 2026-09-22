import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { listMoodEntriesInRange } from "../../lib/db/moodEntries";
import { MoodLogSheet } from "../MoodLog/MoodLogSheet";
import { ToastProvider } from "../ui/Toast";

describe("MoodLogSheet", () => {
  it("lets you pick tags and a note before saving", async () => {
    const onClose = vi.fn<() => void>();
    render(
      <ToastProvider>
        <MoodLogSheet open onClose={onClose} />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Eher gut" }));
    // Picking a mood must not save and close yet.
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "#Sport" }));
    await userEvent.type(screen.getByPlaceholderText("Was beschäftigt dich gerade?"), "Laufen");
    await userEvent.click(screen.getByRole("button", { name: "Stimmung speichern" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const [entry] = await listMoodEntriesInRange(0, Number.POSITIVE_INFINITY);
    expect(entry).toMatchObject({ mood: 4, tags: ["Sport"], note: "Laufen" });
  });
});
