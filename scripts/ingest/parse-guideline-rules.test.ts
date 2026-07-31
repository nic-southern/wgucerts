import { describe, expect, it } from "vitest";
import type { ApiGuidelineRow } from "./partner-api";
import {
  buildGuidelineRules,
  extractCertMentions,
  mentionsCertifications,
} from "./parse-guideline-rules";

/** Requirement prose copied from WGU's published IT transfer guidelines. */
const REQUIREMENTS = {
  linux:
    "One course equivalent to 3 units in Linux foundations, Linux technology, or one of the following certifications: CompTIA: Linux+; LPI: Linux Essentials, LPIC- 1, LPIC-2, or any LPIC \u2013 3; Linux Foundation: Certified System Administrator (LFCS); Red Hat: RHCSA, RHCE or RHCA.",
  penTesting:
    "\u200bOne of the following Certifications: CompTIA Pentest+; EC Council CEH; Offensive Security OSCP+ or OSCE(3); or GIAC: GPEN.",
  introToIt:
    "One course equivalent to 4 units in introduction to IT, or one of the following Certifications: Google IT Support Professional certificate or CompTIA Tech+ certification. May be satisfied by an associate or bachelor\u2019s degree in Information Technology.",
  businessOfIt:
    "One course, equivalent to 4 units, in business of IT applications or can be satisfied by an active ITIL foundations Certification. This course may be satisfied by an associate or bachelor\u2019s degree in Information Technology.",
  uiDesign:
    "\u200bOne course, equivalent to 3 units, in user interface design or user experience design, CIW user interface designer (1D0-621) Certification.",
  python:
    "One course, equivalent to 3 units, in python programing or Python Institute's: PCAP Cert or the PCPP 1 Certification.",
  spreadsheets:
    "One course, equivalent to 3 units, in Spreadsheets. This course must be taken within the past 5 years.",
};

function texts(requirements: string): string[] {
  return extractCertMentions(requirements).map((m) => m.text);
}

function row(overrides: Partial<ApiGuidelineRow>): ApiGuidelineRow {
  return {
    courseCode: "D281",
    transferArea: "Additional Transfer",
    requirements: "",
    apiProgramIds: [204],
    ...overrides,
  };
}

describe("extractCertMentions", () => {
  it("reads a vendor-grouped list behind an explicit header", () => {
    expect(texts(REQUIREMENTS.linux)).toEqual([
      "Linux+",
      "Linux Essentials",
      "LPIC- 1",
      "LPIC-2",
      "LPIC \u2013 3",
      "Certified System Administrator (LFCS)",
      "RHCSA",
      "RHCE",
      "RHCA",
    ]);
  });

  it("reads a list that opens the sentence, past the leading zero-width space", () => {
    expect(texts(REQUIREMENTS.penTesting)).toEqual([
      "Pentest+",
      "CEH",
      "OSCP+",
      "OSCE(3)",
      "GPEN",
    ]);
  });

  it("stops before the prior-degree sentence", () => {
    expect(texts(REQUIREMENTS.introToIt)).toEqual([
      "IT Support Professional",
      "Tech+",
    ]);
  });

  it("reads a certification folded into the sentence without a list header", () => {
    expect(extractCertMentions(REQUIREMENTS.businessOfIt)).toEqual([
      { vendor: "ITIL", text: "foundations" },
    ]);
  });

  it("ignores subject-matter clauses next to an inline certification", () => {
    expect(extractCertMentions(REQUIREMENTS.uiDesign)).toEqual([
      { vendor: "CIW", text: "user interface designer (1D0-621)" },
    ]);
  });

  it("keeps vendor-labelled clauses that omit the word certification", () => {
    expect(texts(REQUIREMENTS.python)).toEqual(["PCAP", "PCPP 1"]);
  });

  it("finds nothing when a course names no credential", () => {
    expect(mentionsCertifications(REQUIREMENTS.spreadsheets)).toBe(false);
    expect(texts(REQUIREMENTS.spreadsheets)).toEqual([]);
  });
});

describe("buildGuidelineRules", () => {
  it("flags the non-transferable area and reads no credentials from it", () => {
    const [rule] = buildGuidelineRules([
      row({
        courseCode: "D522",
        transferArea: "Non-Transferable",
        requirements: "",
        apiProgramIds: [246, 250],
      }),
    ]);
    expect(rule.nonTransferable).toBe(true);
    expect(rule.certMentions).toEqual([]);
  });

  it("keeps a course transferable in one program and not in another", () => {
    const rules = buildGuidelineRules([
      row({
        courseCode: "D522",
        transferArea: "Non-Transferable",
        apiProgramIds: [246, 250],
      }),
      row({
        courseCode: "D522",
        transferArea: "Additional Transfer",
        requirements: "One course, equivalent to 3 units, in Python automation.",
        apiProgramIds: [204],
      }),
    ]);
    expect(rules.map((r) => [r.nonTransferable, r.apiProgramIds])).toEqual([
      [false, [204]],
      [true, [246, 250]],
    ]);
  });

  it("merges the programs a shared rule covers", () => {
    const rules = buildGuidelineRules([
      row({ requirements: REQUIREMENTS.linux, apiProgramIds: [204, 250] }),
      row({ requirements: REQUIREMENTS.linux, apiProgramIds: [250, 182] }),
    ]);
    expect(rules).toHaveLength(1);
    expect(rules[0].apiProgramIds).toEqual([204, 250, 182]);
  });
});
