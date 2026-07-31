import type {
  Catalog,
  Certificate,
  Course,
  CourseCategory,
  Provider,
} from "@/lib/catalog/schema";
import type { UserProfile } from "@/lib/profile/schema";

export type ClearReason =
  | { type: "degree"; degree: string; notes: string }
  | {
      type: "certificate";
      certificateId: string;
      certificateName: string;
      providerName: string;
      source: string;
      confidence: "published" | "estimated";
    };

export type CourseMatch = {
  course: Course;
  cleared: boolean;
  reasons: ClearReason[];
};

export type ApplicableCertificate = {
  certificate: Certificate;
  provider: Provider;
  clearsCourses: Course[];
};

export type MatchResult = {
  programId: string;
  courses: CourseMatch[];
  clearedCount: number;
  remainingCount: number;
  clearedCus: number;
  remainingCus: number;
  totalCus: number;
  applicableCertificates: ApplicableCertificate[];
  ineligibleCertificates: ApplicableCertificate[];
  degreeNotes: string | null;
};

export function matchProgram(
  catalog: Catalog,
  profile: UserProfile,
  programId: string,
): MatchResult {
  const program = catalog.programs.find((p) => p.id === programId);
  if (!program) {
    return {
      programId,
      courses: [],
      clearedCount: 0,
      remainingCount: 0,
      clearedCus: 0,
      remainingCus: 0,
      totalCus: 0,
      applicableCertificates: [],
      ineligibleCertificates: [],
      degreeNotes: null,
    };
  }

  const courses = program.courseIds
    .map((id) => catalog.courses.find((c) => c.id === id))
    .filter((c): c is Course => Boolean(c));

  const clearedByCourse = new Map<string, ClearReason[]>();

  let degreeNotes: string | null = null;
  if (profile.priorDegree !== "none") {
    const rule = catalog.degreeRules.find((r) => r.kind === profile.priorDegree);
    if (rule) {
      degreeNotes = rule.notes;
      const categories = new Set<CourseCategory>(rule.clearsCategories);
      for (const course of courses) {
        if (categories.has(course.category)) {
          const reasons = clearedByCourse.get(course.id) ?? [];
          reasons.push({
            type: "degree",
            degree: profile.priorDegree,
            notes: rule.notes,
          });
          clearedByCourse.set(course.id, reasons);
        }
      }
    }
  }

  const eligibility = new Set(
    catalog.programCertEligibility
      .filter((e) => e.programId === programId)
      .map((e) => e.certificateId),
  );

  const providerById = new Map(catalog.providers.map((p) => [p.id, p]));
  const certById = new Map(catalog.certificates.map((c) => [c.id, c]));

  const applicableCertificates: ApplicableCertificate[] = [];
  const ineligibleCertificates: ApplicableCertificate[] = [];

  for (const certificateId of profile.certificateIds) {
    const certificate = certById.get(certificateId);
    if (!certificate) continue;
    const provider = providerById.get(certificate.providerId);
    if (!provider) continue;

    const clears = catalog.certCourseClears
      .filter(
        (c) =>
          c.certificateId === certificateId &&
          // An empty program list means the rule is not program-specific.
          (c.programIds.length === 0 || c.programIds.includes(programId)),
      )
      .map((c) => {
        const course = courses.find((co) => co.id === c.courseId);
        if (!course) return null;
        return { course, clear: c };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    for (const { course, clear } of clears) {
      const reasons = clearedByCourse.get(course.id) ?? [];
      reasons.push({
        type: "certificate",
        certificateId,
        certificateName: certificate.name,
        providerName: provider.name,
        source: clear.source,
        confidence: clear.confidence,
      });
      clearedByCourse.set(course.id, reasons);
    }

    const entry: ApplicableCertificate = {
      certificate,
      provider,
      clearsCourses: clears.map((c) => c.course),
    };

    if (eligibility.has(certificateId) || clears.length > 0) {
      applicableCertificates.push(entry);
    } else {
      ineligibleCertificates.push(entry);
    }
  }

  const courseMatches: CourseMatch[] = courses.map((course) => {
    const reasons = clearedByCourse.get(course.id) ?? [];
    return {
      course,
      cleared: reasons.length > 0,
      reasons,
    };
  });

  const clearedCount = courseMatches.filter((c) => c.cleared).length;
  const clearedCus = courseMatches
    .filter((c) => c.cleared)
    .reduce((sum, c) => sum + (c.course.cu ?? 0), 0);
  const totalCus =
    program.totalCus ??
    courseMatches.reduce((sum, c) => sum + (c.course.cu ?? 0), 0);
  const remainingCus = Math.max(0, totalCus - clearedCus);

  return {
    programId,
    courses: courseMatches,
    clearedCount,
    remainingCount: courseMatches.length - clearedCount,
    clearedCus,
    remainingCus,
    totalCus,
    applicableCertificates,
    ineligibleCertificates,
    degreeNotes,
  };
}
