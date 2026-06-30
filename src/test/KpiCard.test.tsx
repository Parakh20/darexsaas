import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function KpiCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div>
      <div>{icon}</div>
      <div data-testid="value">{value}</div>
      <div data-testid="label">{label}</div>
    </div>
  );
}

describe("KpiCard component", () => {
  it("renders label and value", () => {
    render(<KpiCard label="Active Opportunities" value={42} icon="🎯" />);
    expect(screen.getByTestId("label")).toHaveTextContent("Active Opportunities");
    expect(screen.getByTestId("value")).toHaveTextContent("42");
  });

  it("renders formatted currency value", () => {
    render(<KpiCard label="Revenue Pipeline" value="12,00,000" icon="💰" />);
    expect(screen.getByTestId("value")).toHaveTextContent("12,00,000");
  });

  it("renders emoji icon", () => {
    render(<KpiCard label="Test" value={0} icon="📊" />);
    expect(screen.getByText("📊")).toBeDefined();
  });
});
