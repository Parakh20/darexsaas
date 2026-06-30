import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatDate, slugify, ok, err } from "@/lib/utils";

describe("cn()", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy conditionals", () => {
    expect(cn("base", false && "hidden", undefined, null, "extra")).toBe("base extra");
  });

  it("resolves conflicting Tailwind classes — last one wins", () => {
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });

  it("resolves conflicting Tailwind text-color classes", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });
});

describe("formatCurrency()", () => {
  it("formats INR by default", () => {
    const result = formatCurrency(50000);
    expect(result).toContain("50,000");
    expect(result).toMatch(/₹|INR/);
  });

  it("formats USD when specified", () => {
    const result = formatCurrency(1000, "USD");
    expect(result).toContain("1,000");
    expect(result).toMatch(/\$|USD/);
  });

  it("formats zero correctly", () => {
    const result = formatCurrency(0);
    expect(result).toBeTruthy();
    expect(result).toContain("0");
  });
});

describe("formatDate()", () => {
  it("returns a non-empty string for a Date object", () => {
    const result = formatDate(new Date("2024-01-15T10:00:00"));
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns a non-empty string for a date string", () => {
    const result = formatDate("2024-06-30");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("slugify()", () => {
  it("converts spaces to hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("converts uppercase to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("hello!@#world")).toBe("hello-world");
  });

  it("collapses multiple special chars into a single hyphen", () => {
    expect(slugify("foo   bar")).toBe("foo-bar");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });

  it("handles a string that is already a valid slug", () => {
    expect(slugify("my-slug-123")).toBe("my-slug-123");
  });
});

describe("ok()", () => {
  it("returns success: true with the provided data", () => {
    const result = ok({ id: "1", name: "test" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: "1", name: "test" });
  });

  it("works with primitive data", () => {
    const result = ok(42);
    expect(result.success).toBe(true);
    expect(result.data).toBe(42);
  });
});

describe("err()", () => {
  it("returns success: false with the error message", () => {
    const result = err("Something went wrong");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Something went wrong");
  });

  it("includes an optional error code when provided", () => {
    const result = err("Not found", "NOT_FOUND");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not found");
    expect(result.code).toBe("NOT_FOUND");
  });

  it("leaves code undefined when not provided", () => {
    const result = err("Oops");
    expect(result.code).toBeUndefined();
  });
});
