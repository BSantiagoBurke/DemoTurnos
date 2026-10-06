import { describe, expect, it } from "vitest";
import { formatArgentinePhone, normalizeArgentinePhone } from "./phone";

describe("normalizeArgentinePhone", () => {
  it.each([
    ["381 123-4567", "5493811234567"],
    ["0381 15 123 4567", "5493811234567"],
    ["+54 9 381 123 4567", "5493811234567"],
    ["54 381 1234567", "5493811234567"],
    ["11 2345-6789", "5491123456789"],
    ["011 15 2345 6789", "5491123456789"],
    ["3863 42-1234", "5493863421234"],
  ])("%s => %s", (input, expected) => {
    expect(normalizeArgentinePhone(input)).toBe(expected);
  });

  it.each(["123", "1234567", "abc", "381 123 45678 9", ""])("rechaza %s", (input) => {
    expect(normalizeArgentinePhone(input)).toBeNull();
  });

  it("formatea para mostrar", () => {
    expect(formatArgentinePhone("5493811234567")).toBe("381 123-4567");
  });
});
