import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "../Toast";
import type { ToastInput } from "../toastContext";

let show: (input: ToastInput) => string = () => "";
function Grab() {
  show = useToast().show;
  return null;
}

function renderToasts() {
  render(
    <ToastProvider>
      <Grab />
    </ToastProvider>,
  );
}

describe("Toast", () => {
  it("calls onExpire when it times out", async () => {
    const onExpire = vi.fn<() => void>();
    renderToasts();
    act(() => {
      show({ message: "Weg gleich", durationMs: 30, onExpire });
    });
    await waitFor(() => expect(onExpire).toHaveBeenCalledTimes(1));
  });

  it("does not expire when its action was used", async () => {
    const onExpire = vi.fn<() => void>();
    const onClick = vi.fn<() => void>();
    renderToasts();
    act(() => {
      show({ message: "Gelöscht", action: { label: "Rückgängig", onClick }, onExpire });
    });
    await userEvent.click(screen.getByRole("button", { name: "Rückgängig" }));
    expect(onClick).toHaveBeenCalled();
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("closing it counts as expiry", async () => {
    const onExpire = vi.fn<() => void>();
    renderToasts();
    act(() => {
      show({ message: "Hallo", onExpire });
    });
    await userEvent.click(screen.getByRole("button", { name: "Schließen" }));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
