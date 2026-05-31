import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "../Card";
import { Surface } from "../Surface";

describe("Surface + Card", () => {
  it("renders Surface with children", () => {
    render(<Surface>Hallo</Surface>);
    expect(screen.getByText("Hallo")).toBeInTheDocument();
  });

  it("Card without header/footer renders content directly", () => {
    render(<Card>Body</Card>);
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("Card with header + footer renders all three regions", () => {
    render(
      <Card header={<h2>Titel</h2>} footer={<button>Fuß</button>}>
        Body
      </Card>,
    );
    expect(screen.getByText("Titel")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fuß" })).toBeInTheDocument();
  });

  it("applies accentBorder when category set", () => {
    const { container } = render(<Surface accentBorder="mood">x</Surface>);
    expect(container.firstChild).toHaveClass("border-l-4");
  });
});
