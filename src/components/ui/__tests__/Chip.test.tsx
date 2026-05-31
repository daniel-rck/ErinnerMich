import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Chip } from "../Chip";

describe("Chip", () => {
  it("reflects selected state via aria-pressed", () => {
    render(<Chip selected>Aktiv</Chip>);
    expect(screen.getByRole("button", { name: "Aktiv" })).toHaveAttribute("aria-pressed", "true");
  });

  it("does not set aria-pressed when not selected", () => {
    render(<Chip>Inaktiv</Chip>);
    expect(screen.getByRole("button", { name: "Inaktiv" })).not.toHaveAttribute("aria-pressed");
  });

  it("fires onClick", async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Tag</Chip>);
    await userEvent.click(screen.getByRole("button", { name: "Tag" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("supports category prop for color tone", () => {
    render(<Chip category="mood">Stimmung</Chip>);
    expect(screen.getByRole("button", { name: "Stimmung" })).toBeInTheDocument();
  });
});
