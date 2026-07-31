import {
  createCertResolver,
  type CertMention,
  type CertRecord,
  type ProviderRecord,
} from "./cert-match";
import type { GuidelineRule } from "./parse-guideline-rules";

export type CertCourseClear = {
  certificateId: string;
  courseId: string;
  source: string;
  confidence: "published" | "estimated";
  programIds: string[];
};

export type NonTransferableCourse = {
  courseId: string;
  programIds: string[];
};

/** A certification named in a WGU guideline that we could not match to a record. */
export type UnresolvedMention = {
  text: string;
  vendor?: string;
  source: string;
  course: string;
};

export type CourseRef = {
  id: string;
  code: string;
  name: string;
  programIds: string[];
};

export type BuildCertClearsInput = {
  certificates: CertRecord[];
  providers: ProviderRecord[];
  courses: CourseRef[];
  rules: GuidelineRule[];
  /** WGU's numeric program id → our program id. */
  programIdByApiId: Map<number, string>;
  /** Where the rules came from, shown to users alongside each match. */
  source: string;
};

export type BuildCertClearsResult = {
  clears: CertCourseClear[];
  nonTransferable: NonTransferableCourse[];
  unresolved: UnresolvedMention[];
  /** Rules whose course is not in any program we publish. */
  skippedCourseCodes: string[];
};

export function buildCertCourseClears(
  input: BuildCertClearsInput,
): BuildCertClearsResult {
  const resolver = createCertResolver(input.certificates, input.providers);
  const courseIdByCode = new Map(
    input.courses.map((c) => [c.code.toUpperCase(), c]),
  );

  const clears = new Map<string, CertCourseClear>();
  const nonTransferable = new Map<string, NonTransferableCourse>();
  const unresolved: UnresolvedMention[] = [];
  const skippedCourseCodes: string[] = [];

  const mergeProgramIds = (into: string[], from: string[]) => {
    for (const id of from) if (!into.includes(id)) into.push(id);
  };

  const applyMentions = (
    mentions: CertMention[],
    course: CourseRef,
    programIds: string[],
  ) => {
    for (const mention of mentions) {
      const { certificateIds } = resolver.resolve(mention);
      if (certificateIds.length === 0) {
        unresolved.push({
          ...mention,
          source: input.source,
          course: `${course.code} ${course.name}`,
        });
        continue;
      }
      for (const certificateId of certificateIds) {
        const key = `${certificateId}::${course.id}`;
        const existing = clears.get(key);
        if (existing) {
          mergeProgramIds(existing.programIds, programIds);
          continue;
        }
        clears.set(key, {
          certificateId,
          courseId: course.id,
          source: input.source,
          confidence: "published",
          programIds: [...programIds],
        });
      }
    }
  };

  for (const rule of input.rules) {
    const course = courseIdByCode.get(rule.courseCode);
    if (!course) {
      skippedCourseCodes.push(rule.courseCode);
      continue;
    }

    // A rule can name programs we do not publish, such as a catalog revision
    // that is not live yet. Narrow it to the course's own programs.
    const programIds = rule.apiProgramIds
      .map((apiId) => input.programIdByApiId.get(apiId))
      .filter((id): id is string => id != null && course.programIds.includes(id));
    if (programIds.length === 0) continue;

    if (rule.nonTransferable) {
      const existing = nonTransferable.get(course.id);
      if (existing) mergeProgramIds(existing.programIds, programIds);
      else nonTransferable.set(course.id, { courseId: course.id, programIds });
      continue;
    }

    applyMentions(rule.certMentions, course, programIds);
  }

  return {
    clears: [...clears.values()].sort(
      (a, b) =>
        a.courseId.localeCompare(b.courseId) ||
        a.certificateId.localeCompare(b.certificateId),
    ),
    nonTransferable: [...nonTransferable.values()].sort((a, b) =>
      a.courseId.localeCompare(b.courseId),
    ),
    unresolved,
    skippedCourseCodes: [...new Set(skippedCourseCodes)].sort(),
  };
}
