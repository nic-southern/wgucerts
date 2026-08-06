import type {
  Catalog,
  Certificate,
  Course,
  CourseCategory,
  CourseTime,
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
    }
  | {
      type: "transfer";
      transferCourseId: string;
      transferCourseName: string;
      providerName: string;
      source: string;
      confidence: "published" | "estimated";
    }
  /** Marked done by hand, which needs no evidence beyond the planner saying so. */
  | { type: "self" };

export type CourseMatch = {
  course: Course;
  cleared: boolean;
  reasons: ClearReason[];
  /** Community-reported clear time, when anyone has reported one. */
  time: CourseTime | null;
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
  /** 0–100, rounded. Measured in competency units, not course count. */
  percentComplete: number;
  /** Days of coursework left, summing medians for courses that have one. */
  remainingDays: number;
  /** Remaining courses nobody has reported a time for, so the sum is a floor. */
  remainingWithoutTime: number;
  /**
   * Courses credited by a certificate, prior degree, or transfer. Courses the
   * planner passed at WGU are excluded: doing the work saved no time.
   */
  creditedCount: number;
  /** Reported days for those courses — coursework the planner skips. */
  savedDays: number;
  /** Credited courses with no reported time, so `savedDays` is a floor too. */
  savedWithoutTime: number;
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
      percentComplete: 0,
      remainingDays: 0,
      remainingWithoutTime: 0,
      creditedCount: 0,
      savedDays: 0,
      savedWithoutTime: 0,
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
      const excluded = new Set(rule.excludesCourseIds);
      for (const course of courses) {
        if (excluded.has(course.id)) continue;
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

  // Finishing a Sophia or Study.com course clears whatever it maps to.
  const transferProviderById = new Map(
    catalog.transferProviders.map((p) => [p.id, p]),
  );
  const transferCourseById = new Map(
    catalog.transferCourses.map((c) => [c.id, c]),
  );

  for (const transferCourseId of profile.completedTransferCourseIds) {
    const transferCourse = transferCourseById.get(transferCourseId);
    if (!transferCourse) continue;
    const provider = transferProviderById.get(transferCourse.providerId);
    if (!provider) continue;

    for (const clear of catalog.transferCourseClears) {
      if (clear.transferCourseId !== transferCourseId) continue;
      const course = courses.find((c) => c.id === clear.courseId);
      if (!course) continue;

      const reasons = clearedByCourse.get(course.id) ?? [];
      reasons.push({
        type: "transfer",
        transferCourseId,
        transferCourseName: transferCourse.name,
        providerName: provider.name,
        source: clear.source,
        confidence: clear.confidence,
      });
      clearedByCourse.set(course.id, reasons);
    }
  }

  const markedDone = new Set(profile.completedCourseIds);
  const timeByCourseId = new Map(
    catalog.courseTimes.map((t) => [t.courseId, t]),
  );

  const courseMatches: CourseMatch[] = courses.map((course) => {
    const reasons = [...(clearedByCourse.get(course.id) ?? [])];
    if (markedDone.has(course.id)) {
      reasons.push({ type: "self" });
    }
    return {
      course,
      cleared: reasons.length > 0,
      reasons,
      time: timeByCourseId.get(course.id) ?? null,
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

  const remaining = courseMatches.filter((c) => !c.cleared);
  const remainingDays = remaining.reduce(
    (sum, c) => sum + (c.time?.medianDays ?? 0),
    0,
  );

  // Credit earned elsewhere is time skipped. Ticking a course off by hand is
  // not, so a course only counts here if something other than the planner's own
  // mark clears it.
  const credited = courseMatches.filter((c) =>
    c.reasons.some((r) => r.type !== "self"),
  );

  return {
    programId,
    courses: courseMatches,
    clearedCount,
    remainingCount: remaining.length,
    clearedCus,
    remainingCus,
    totalCus,
    percentComplete:
      totalCus > 0
        ? Math.min(100, Math.round((clearedCus / totalCus) * 100))
        : 0,
    remainingDays,
    remainingWithoutTime: remaining.filter((c) => !c.time?.medianDays).length,
    creditedCount: credited.length,
    savedDays: credited.reduce((sum, c) => sum + (c.time?.medianDays ?? 0), 0),
    savedWithoutTime: credited.filter((c) => !c.time?.medianDays).length,
    applicableCertificates,
    ineligibleCertificates,
    degreeNotes,
  };
}
