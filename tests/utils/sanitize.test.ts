import { describe, it, expect } from "vitest";
import { sanitizeText } from "../../src/utils/index.js";

describe("sanitizeText", () => {
  it("replaces em dashes with space-hyphen-space", () => {
    expect(sanitizeText("hello \u2014 world")).toBe("hello - world");
  });

  it("replaces en dashes with hyphen", () => {
    expect(sanitizeText("2026\u20132027")).toBe("2026-2027");
  });

  it("replaces smart double quotes with straight quotes", () => {
    expect(sanitizeText('\u201CHello\u201D')).toBe('"Hello"');
  });

  it("replaces smart single quotes with straight quotes", () => {
    expect(sanitizeText('\u2018Hello\u2019')).toBe("'Hello'");
  });

  it("replaces ellipsis character with three dots", () => {
    expect(sanitizeText("wait\u2026")).toBe("wait...");
  });

  it("handles multiple replacements in one string", () => {
    expect(sanitizeText('He said \u201Chello\u201D \u2014 then left\u2026'))
      .toBe('He said "hello" - then left...');
  });

  it("passes through clean ASCII text unchanged", () => {
    expect(sanitizeText("normal text - no issues")).toBe("normal text - no issues");
  });

  it("repairs common mojibake punctuation", () => {
    expect(sanitizeText("Great connecting today \u00e2\u20ac\u201d next steps")).toBe("Great connecting today - next steps");
    expect(sanitizeText("He said \u00e2\u20ac\u0153hello\u00e2\u20ac\u001d")).toBe('He said "hello"');
    expect(sanitizeText("Wait\u00e2\u20ac\u00a6")).toBe("Wait...");
  });

  it("removes stray mojibake prefixes and zero-width characters", () => {
    expect(sanitizeText("A\u00c2 B\u200bC")).toBe("A BC");
  });

  it("handles empty string", () => {
    expect(sanitizeText("")).toBe("");
  });
});
