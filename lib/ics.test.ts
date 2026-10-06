import { describe, expect, it } from "vitest";
import { buildIcs } from "./ics";

describe("buildIcs", () => {
  it("genera un VEVENT con fechas en UTC y texto escapado", () => {
    const ics = buildIcs({
      uid: "bk_1@beecode",
      start: "2026-10-07T10:00:00-03:00",
      end: "2026-10-07T10:30:00-03:00",
      title: "Corte, Barbería",
      location: "25 de Mayo 450; Tucumán",
      now: new Date("2026-10-06T12:00:00Z"),
    });
    expect(ics).toContain("DTSTART:20261007T130000Z");
    expect(ics).toContain("DTEND:20261007T133000Z");
    expect(ics).toContain("SUMMARY:Corte\\, Barbería");
    expect(ics).toContain("LOCATION:25 de Mayo 450\\; Tucumán");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});
