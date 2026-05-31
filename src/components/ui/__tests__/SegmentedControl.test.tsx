import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "../SegmentedControl";

describe("SegmentedControl", () => {
  it("renders as radiogroup with correct option ARIA", () => {
    render(
      <SegmentedControl
        value="b"
        onChange={() => {}}
        ariaLabel="Zeitraum"
        options={[
          { value: "a", label: "7T" },
          { value: "b", label: "30T" },
          { value: "c", label: "90T" },
        ]}
      />,
    );
    expect(screen.getByRole("radiogroup", { name: "Zeitraum" })).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
  });

  it("fires onChange when clicking another segment", async () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        value="a"
        onChange={onChange}
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: "B" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
