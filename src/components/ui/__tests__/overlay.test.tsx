import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { BottomSheet } from "../BottomSheet";
import { Modal } from "../Modal";

describe("overlays", () => {
  it("closes only the topmost overlay on Escape and keeps the page locked", async () => {
    const closeSheet = vi.fn<() => void>();
    function Harness() {
      const [modalOpen, setModalOpen] = useState(true);
      return (
        <BottomSheet open onClose={closeSheet} title="Außen">
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Innen">
            <button type="button">Ok</button>
          </Modal>
        </BottomSheet>
      );
    }
    render(<Harness />);
    expect(screen.getByRole("dialog", { name: "Innen" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    // The exit animation keeps the node around briefly.
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Innen" })).toBeNull());
    expect(closeSheet).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.keyboard("{Escape}");
    expect(closeSheet).toHaveBeenCalledTimes(1);
  });

  it("keeps Tab inside the dialog", async () => {
    render(
      <>
        <button type="button">Draußen</button>
        <Modal open onClose={() => {}} title="Dialog">
          <button type="button">Eins</button>
          <button type="button">Zwei</button>
        </Modal>
      </>,
    );
    // Close button, Eins, Zwei — then wrap back to the close button.
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Schließen" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "Draußen", hidden: true })).not.toHaveFocus();
  });

  it("gives the bottom sheet a close button", async () => {
    const onClose = vi.fn<() => void>();
    render(
      <BottomSheet open onClose={onClose} title="Sheet">
        <p>Inhalt</p>
      </BottomSheet>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Schließen" }));
    expect(onClose).toHaveBeenCalled();
  });
});
