import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sparkles } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders title + description", () => {
    render(<EmptyState title="Nichts hier" description="Leg los." />);
    expect(screen.getByText("Nichts hier")).toBeInTheDocument();
    expect(screen.getByText("Leg los.")).toBeInTheDocument();
  });

  it("renders primary and secondary actions and fires callbacks", async () => {
    const onPrimary = vi.fn();
    const onSecondary = vi.fn();
    render(
      <EmptyState
        title="Leer"
        icon={Sparkles}
        primaryAction={{ label: "Neu", onClick: onPrimary }}
        secondaryAction={{ label: "Vorlage", onClick: onSecondary }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Neu" }));
    await userEvent.click(screen.getByRole("button", { name: "Vorlage" }));
    expect(onPrimary).toHaveBeenCalledOnce();
    expect(onSecondary).toHaveBeenCalledOnce();
  });

  it("accepts emoji icon string", () => {
    render(<EmptyState title="Leer" icon="🌱" />);
    expect(screen.getByText("🌱")).toBeInTheDocument();
  });
});
