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
  transferProviders: [{ id: "transfer:sophia", name: "Sophia" }],
  transferCourses: [
    {
      id: "transfer:sophia:english-comp-i",
      providerId: "transfer:sophia",
      name: "English Composition I",
    },
  ],
  transferCourseClears: [
    {
      transferCourseId: "transfer:sophia:english-comp-i",
      courseId: "course:d269",
      source: "test",
      confidence: "published",
    },
  ],
  courseTimes: [
    {
      courseId: "course:d315",
      reportCount: 2,
      medianDays: 5,
      lowDays: 3,
      highDays: 7,
      reports: [
        {
          url: "https://www.reddit.com/r/WGU/comments/aaa/d315_in_3_days/",
          title: "D315 in 3 days",
          days: 3,
        },
        {
          url: "https://www.reddit.com/r/WGU/comments/bbb/d315_in_7_days/",
          title: "D315 in 7 days",
          days: 7,
        },
      ],
    },
    {
      courseId: "course:d269",
      reportCount: 1,
      medianDays: 3,
      lowDays: 3,
      highDays: 3,
      reports: [
        {
          url: "https://www.reddit.com/r/WGU/comments/ccc/d269_in_3_days/",
          title: "D269 in 3 days",
          days: 3,
        },
      ],
    },
  ],
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

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    selectedProgramId: "program:bs-it",
    priorDegree: "none",
    certificateIds: [],
    completedCourseIds: [],
    completedTransferCourseIds: [],
    ...overrides,
  };
}

describe("matchProgram", () => {
  it("clears gen ed from associates degree", () => {
    const profile = makeProfile({ priorDegree: "associates" });
    const result = matchProgram(catalog, profile, "program:bs-it");
    const composition = result.courses.find((c) => c.course.code === "D269");
    expect(composition?.cleared).toBe(true);
    expect(result.clearedCount).toBe(1);
  });

  it("clears foundations from associates IT and cert course", () => {
    const profile = makeProfile({
      priorDegree: "associates_it",
      certificateIds: ["cert:comptia:network-plus"],
    });
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
    const profile = makeProfile({
      certificateIds: ["cert:comptia:network-plus"],
    });
    const result = matchProgram(thin, profile, "program:bs-it");
    expect(result.applicableCertificates).toHaveLength(1);
    expect(result.clearedCount).toBe(0);
  });

  it("clears a course the planner marked done", () => {
    const profile = makeProfile({ completedCourseIds: ["course:d322"] });
    const result = matchProgram(catalog, profile, "program:bs-it");
    const intro = result.courses.find((c) => c.course.code === "D322");
    expect(intro?.cleared).toBe(true);
    expect(intro?.reasons).toEqual([{ type: "self" }]);
  });

  it("clears the WGU course a finished transfer course maps to", () => {
    const profile = makeProfile({
      completedTransferCourseIds: ["transfer:sophia:english-comp-i"],
    });
    const result = matchProgram(catalog, profile, "program:bs-it");
    const composition = result.courses.find((c) => c.course.code === "D269");
    expect(composition?.cleared).toBe(true);
    expect(composition?.reasons).toEqual([
      {
        type: "transfer",
        transferCourseId: "transfer:sophia:english-comp-i",
        transferCourseName: "English Composition I",
        providerName: "Sophia",
        source: "test",
        confidence: "published",
      },
    ]);
  });

  it("keeps every reason a course is clear, not just the first", () => {
    const profile = makeProfile({
      priorDegree: "associates",
      completedTransferCourseIds: ["transfer:sophia:english-comp-i"],
      completedCourseIds: ["course:d269"],
    });
    const result = matchProgram(catalog, profile, "program:bs-it");
    const composition = result.courses.find((c) => c.course.code === "D269");
    expect(composition?.reasons.map((r) => r.type)).toEqual([
      "degree",
      "transfer",
      "self",
    ]);
  });

  it("measures progress in competency units, not course count", () => {
    // D322 is 4 of the program's 10 CUs but only 1 of its 3 courses.
    const profile = makeProfile({ completedCourseIds: ["course:d322"] });
    const result = matchProgram(catalog, profile, "program:bs-it");
    expect(result.totalCus).toBe(10);
    expect(result.clearedCus).toBe(4);
    expect(result.percentComplete).toBe(40);
  });

  it("reports no progress on an untouched program", () => {
    const result = matchProgram(catalog, makeProfile(), "program:bs-it");
    expect(result.percentComplete).toBe(0);
    expect(result.clearedCount).toBe(0);
  });

  it("reports full progress once everything is done", () => {
    const profile = makeProfile({
      completedCourseIds: ["course:d315", "course:d269", "course:d322"],
    });
    const result = matchProgram(catalog, profile, "program:bs-it");
    expect(result.percentComplete).toBe(100);
    expect(result.remainingCus).toBe(0);
    expect(result.remainingDays).toBe(0);
    expect(result.remainingWithoutTime).toBe(0);
  });

  it("sums clear times for remaining courses and counts those with none", () => {
    const result = matchProgram(catalog, makeProfile(), "program:bs-it");
    // D315 is 5 days, D269 is 3, and nobody has reported on D322.
    expect(result.remainingDays).toBe(8);
    expect(result.remainingWithoutTime).toBe(1);
  });

  it("drops a course's time from the estimate once it is done", () => {
    const profile = makeProfile({ completedCourseIds: ["course:d315"] });
    const result = matchProgram(catalog, profile, "program:bs-it");
    expect(result.remainingDays).toBe(3);
  });

  it("attaches reported times to courses and leaves the rest null", () => {
    const result = matchProgram(catalog, makeProfile(), "program:bs-it");
    const byCode = new Map(result.courses.map((c) => [c.course.code, c]));
    expect(byCode.get("D315")?.time?.reportCount).toBe(2);
    expect(byCode.get("D315")?.time?.lowDays).toBe(3);
    expect(byCode.get("D322")?.time).toBeNull();
  });

  it("keeps a course's reports after it is marked done", () => {
    // Finishing a course drops it from the estimate but not from the record of
    // where its time came from.
    const profile = makeProfile({ completedCourseIds: ["course:d315"] });
    const result = matchProgram(catalog, profile, "program:bs-it");
    const row = result.courses.find((c) => c.course.code === "D315");
    expect(row?.cleared).toBe(true);
    expect(row?.time?.reports.length).toBeGreaterThan(0);
  });

  it("counts time skipped by a certificate", () => {
    const profile = makeProfile({
      certificateIds: ["cert:comptia:network-plus"],
    });
    const result = matchProgram(catalog, profile, "program:bs-it");
    // The cert clears D315, which students reported at 5 days.
    expect(result.creditedCount).toBe(1);
    expect(result.savedDays).toBe(5);
    expect(result.savedWithoutTime).toBe(0);
  });

  it("counts time skipped by a prior degree and a transfer course together", () => {
    const profile = makeProfile({
      priorDegree: "associates_it",
      completedTransferCourseIds: ["transfer:sophia:english-comp-i"],
    });
    const result = matchProgram(catalog, profile, "program:bs-it");
    // The degree clears all three; D315 is 5 days and D269 is 3, and nobody has
    // reported on D322.
    expect(result.creditedCount).toBe(3);
    expect(result.savedDays).toBe(8);
    expect(result.savedWithoutTime).toBe(1);
  });

  it("credits nothing for a course the planner passed themselves", () => {
    const profile = makeProfile({ completedCourseIds: ["course:d315"] });
    const result = matchProgram(catalog, profile, "program:bs-it");
    expect(result.creditedCount).toBe(0);
    expect(result.savedDays).toBe(0);
  });

  it("still credits a course the planner also ticked off", () => {
    // The certificate is why it is done; the tick does not cancel that.
    const profile = makeProfile({
      certificateIds: ["cert:comptia:network-plus"],
      completedCourseIds: ["course:d315"],
    });
    const result = matchProgram(catalog, profile, "program:bs-it");
    expect(result.creditedCount).toBe(1);
    expect(result.savedDays).toBe(5);
  });

  it("counts a course once even when several credentials clear it", () => {
    const profile = makeProfile({
      priorDegree: "associates",
      completedTransferCourseIds: ["transfer:sophia:english-comp-i"],
    });
    const result = matchProgram(catalog, profile, "program:bs-it");
    // Both the degree and the Sophia course clear D269; it is 3 days, not 6.
    expect(result.creditedCount).toBe(1);
    expect(result.savedDays).toBe(3);
  });

  it("ignores a finished transfer course that clears nothing in this program", () => {
    const profile = makeProfile({
      completedTransferCourseIds: ["transfer:sophia:unknown"],
    });
    const result = matchProgram(catalog, profile, "program:bs-it");
    expect(result.clearedCount).toBe(0);
  });
});
