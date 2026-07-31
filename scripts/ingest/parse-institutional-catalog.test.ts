import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseInstitutionalCatalogText } from "./parse-institutional-catalog";

describe("parseInstitutionalCatalogText", () => {
  it("extracts cyber course tables with CUs from fixture text", () => {
    const padded = `
Bachelor of Science, Cybersecurity and Information Assurance
CCN Course Number Course Description CUs Term
ITEC 2002 D322 Introduction to IT 4 1
ENGL 1712 D270 Composition: Successful Self-Expression 3 1
ITEC 2112 D315 Network and Security - Foundations 3 2
COMM 1011 D268 Introduction to Communication: Connecting with Others 3 2
PHIL 1020 D265 Critical Thinking: Reason and Evidence 3 2
HUMN 1101 D333 Ethics in Technology 3 2
MATH 1200 C957 Applied Algebra 3 3
MATH 1101 C955 Applied Probability and Statistics 3 3
SCIE 1001 C683 Natural Science Lab 2 3
HLTH 1010 C458 Health, Fitness, and Wellness 4 3
ITEC 2013 D316 IT Foundations 4 4
ITEC 2023 D317 IT Applications 4 4
ITEC 3602 D325 Networks 4 4
ITEC 2113 D329 Network and Security - Applications 4 5
ITAS 3030 D827 Fundamentals of Information Security 3 5
ITAS 3031 D340 Cyber Defense and Countermeasures 4 9
BSCSIA 202509 Total CUs: 122
`;
    const parsed = parseInstitutionalCatalogText(padded);
    const cyber = parsed.find((p) => p.programCode === "BSCSIA");
    expect(cyber?.courses.length).toBeGreaterThanOrEqual(15);
    expect(cyber?.totalCus).toBe(122);
    expect(cyber?.courses.some((c) => c.code === "D322" && c.cu === 4)).toBe(
      true,
    );
  });

  it("parses live-fetched catalog snapshot when present", () => {
    const snapshot = path.resolve(
      process.cwd(),
      "data/catalog/institutional-catalog.txt",
    );
    let text: string;
    try {
      text = readFileSync(snapshot, "utf8");
    } catch {
      // Optional offline fixture; skip if ingest has not cached it yet
      return;
    }
    const parsed = parseInstitutionalCatalogText(text);
    expect(parsed.length).toBeGreaterThanOrEqual(5);
    const cyber = parsed.find((p) => p.programCode === "BSCSIA");
    expect((cyber?.courses.length ?? 0)).toBeGreaterThanOrEqual(30);
  });
});
