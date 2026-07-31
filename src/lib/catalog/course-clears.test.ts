import { describe, expect, it } from "vitest";
import type { Catalog } from "./schema";
import { getClearsForCourse } from "./course-clears";

const CYBER = "program:bs-cybersecurity-and-information-assurance";
const IT = "program:bs-information-technology";

const catalog: Catalog = {
  meta: {
    fetchedAt: "2026-01-01T00:00:00.000Z",
    sources: [
      {
        name: "test",
        url: "https://partners.wgu.edu/general-transfer-guidelines",
      },
    ],
  },
  providers: [{ id: "provider:comptia", name: "CompTIA" }],
  certificates: [
    {
      id: "cert:comptia:data-plus",
      providerId: "provider:comptia",
      name: "CompTIA Data+",
    },
  ],
  programs: [],
  courses: [
    {
      id: "course:d492",
      code: "D492",
      name: "Data Analytics – Applications",
      cu: 4,
      category: "core",
      programIds: [CYBER, IT],
    },
    {
      id: "course:d522",
      code: "D522",
      name: "Automation Everywhere",
      cu: 3,
      category: "core",
      programIds: [CYBER, IT],
    },
  ],
  programCertEligibility: [],
  certCourseClears: [
    {
      certificateId: "cert:comptia:data-plus",
      courseId: "course:d492",
      source: "test",
      confidence: "published",
      programIds: [CYBER],
    },
  ],
  nonTransferableCourses: [{ courseId: "course:d522", programIds: [IT] }],
  transferProviders: [{ id: "transfer:sophia", name: "Sophia" }],
  transferCourses: [
    {
      id: "transfer:sophia:intro-stats",
      providerId: "transfer:sophia",
      name: "Introduction to Statistics",
      externalCode: "SOPH-0005",
    },
  ],
  transferCourseClears: [
    {
      transferCourseId: "transfer:sophia:intro-stats",
      courseId: "course:d492",
      source: "test",
      confidence: "estimated",
    },
  ],
  degreeRules: [],
};

describe("getClearsForCourse", () => {
  it("returns certs and transfer courses that clear a WGU course", () => {
    const options = getClearsForCourse(catalog, "course:d492", CYBER);
    expect(options.certificates).toHaveLength(1);
    expect(options.certificates[0].certificate.name).toBe("CompTIA Data+");
    expect(options.transferCourses).toHaveLength(1);
    expect(options.transferCourses[0].provider.name).toBe("Sophia");
  });

  it("omits a certificate WGU does not accept for this program", () => {
    const options = getClearsForCourse(catalog, "course:d492", IT);
    expect(options.certificates).toEqual([]);
    expect(options.transferCourses).toHaveLength(1);
  });

  it("reports a course as non-transferable only where WGU says so", () => {
    expect(getClearsForCourse(catalog, "course:d522", IT).nonTransferable).toBe(
      true,
    );
    expect(
      getClearsForCourse(catalog, "course:d522", CYBER).nonTransferable,
    ).toBe(false);
  });
});
