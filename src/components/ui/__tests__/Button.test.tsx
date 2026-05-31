import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Plus } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../Button";

describe("Button", () => {
  it("renders children and handles click", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Speichern</Button>);
    const btn = screen.getByRole("button", { name: "Speichern" });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disables when loading and exposes aria-busy", () => {
    render(<Button loading>Lade</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("supports leading icon and renders alongside label", () => {
    render(<Button leadingIcon={Plus}>Neu</Button>);
    expect(screen.getByRole("button", { name: "Neu" })).toBeInTheDocument();
  });

  it("respects type prop", () => {
    render(<Button type="submit">Senden</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
