import { describe, expect, it } from "vitest";
import type { Catalog } from "@/lib/catalog/schema";
import type { UserProfile } from "@/lib/profile/schema";
import { matchProgram } from "./engine";

const catalog: Catalog = {
  meta: {
    fetchedAt: "2026-01-01T00:00:00.000Z",
    sources: [
      {
        name: "test",
        url: "https://www.wgu.edu/admissions/transfers/wgu-transcript-request/transferable-certifications.html",
      },
    ],
  },
  providers: [{ id: "provider:comptia", name: "CompTIA" }],
  certificates: [
    {
      id: "cert:comptia:network-plus",
      providerId: "provider:comptia",
      name: "CompTIA Network+",
    },
  ],
  programs: [
    {
      id: "program:bs-it",
      name: "B.S. Information Technology",
      slug: "bs-information-technology",
      degreeLevel: "bachelors",
      courseIds: ["course:d315", "course:d269", "course:d322"],
    },
  ],
  courses: [
    {
      id: "course:d315",
      code: "D315",
      name: "Network and Security – Foundations",
      cu: 3,
      category: "foundations",
      programIds: ["program:bs-it"],
    },
    {
      id: "course:d269",
      code: "D269",
      name: "Composition",
      cu: 3,
      category: "genEd",
      programIds: ["program:bs-it"],
    },
    {
      id: "course:d322",
      code: "D322",
      name: "Introduction to IT",
      cu: 4,
      category: "foundations",
      programIds: ["program:bs-it"],
    },
  ],
  programCertEligibility: [
    {
      programId: "program:bs-it",
      certificateId: "cert:comptia:network-plus",
    },
  ],
  certCourseClears: [
    {
      certificateId: "cert:comptia:network-plus",
      courseId: "course:d315",
      source: "test",
      confidence: "published",
      programIds: ["program:bs-it"],
    },
  ],
  nonTransferableCourses: [],
  transferProviders: [],
  transferCourses: [],
  transferCourseClears: [],
  degreeRules: [
    {
      kind: "associates",
      clearsCategories: ["genEd"],
      notes: "Associates clears gen ed",
    },
    {
      kind: "associates_it",
      clearsCategories: ["genEd", "foundations"],
      notes: "IT associates clears foundations",
    },
    {
      kind: "bachelors",
      clearsCategories: ["genEd"],
      notes: "Bachelors clears gen ed",
    },
  ],
};

describe("matchProgram", () => {
  it("clears gen ed from associates degree", () => {
    const profile: UserProfile = {
      selectedProgramId: "program:bs-it",
      priorDegree: "associates",
      certificateIds: [],
    };
    const result = matchProgram(catalog, profile, "program:bs-it");
    const composition = result.courses.find((c) => c.course.code === "D269");
    expect(composition?.cleared).toBe(true);
    expect(result.clearedCount).toBe(1);
  });

  it("clears foundations from associates IT and cert course", () => {
    const profile: UserProfile = {
      selectedProgramId: "program:bs-it",
      priorDegree: "associates_it",
      certificateIds: ["cert:comptia:network-plus"],
    };
    const result = matchProgram(catalog, profile, "program:bs-it");
    expect(result.clearedCount).toBe(3);
    expect(result.applicableCertificates).toHaveLength(1);
    expect(result.remainingCount).toBe(0);
    expect(result.clearedCus).toBeGreaterThan(0);
    expect(result.remainingCus).toBe(0);
  });

  it("marks cert applicable via eligibility even without course clear", () => {
    const thin: Catalog = {
      ...catalog,
      certCourseClears: [],
    };
    const profile: UserProfile = {
      selectedProgramId: "program:bs-it",
      priorDegree: "none",
      certificateIds: ["cert:comptia:network-plus"],
    };
    const result = matchProgram(thin, profile, "program:bs-it");
    expect(result.applicableCertificates).toHaveLength(1);
    expect(result.clearedCount).toBe(0);
  });
});
