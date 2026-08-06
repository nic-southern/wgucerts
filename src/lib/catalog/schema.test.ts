import { describe, expect, it } from "vitest";
import { getCatalog } from "./load";

describe("catalog snapshot", () => {
  it("parses committed catalog through Zod", () => {
    const catalog = getCatalog();
    expect(catalog.programs.length).toBeGreaterThan(5);
    expect(catalog.providers.some((p) => /comptia/i.test(p.name))).toBe(true);
    expect(catalog.degreeRules.map((r) => r.kind)).toEqual([
      "associates",
      "associates_it",
      "bachelors",
    ]);
    expect(
      catalog.degreeRules.every((r) =>
        r.excludesCourseIds.includes("course:d333"),
      ),
    ).toBe(true);
  });
});
