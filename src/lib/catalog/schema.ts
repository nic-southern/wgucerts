import { z } from "zod";

export const courseCategorySchema = z.enum([
  "genEd",
  "foundations",
  "core",
  "elective",
  "unknown",
]);

export const degreeKindSchema = z.enum([
  "associates",
  "associates_it",
  "bachelors",
]);

export const providerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const certificateSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()).optional(),
});

export const programSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  /** WGU's program code, e.g. `BSCSIA`. Stable across catalog revisions. */
  code: z.string().optional(),
  degreeLevel: z.enum(["associates", "bachelors", "masters", "accelerated"]),
  url: z.string().url().optional(),
  /** Total competency units for the standard path, when known. */
  totalCus: z.number().nonnegative().optional(),
  courseIds: z.array(z.string()),
});

export const courseSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  cu: z.number().nonnegative().optional(),
  category: courseCategorySchema.default("unknown"),
  programIds: z.array(z.string()),
});

export const programCertEligibilitySchema = z.object({
  programId: z.string().min(1),
  certificateId: z.string().min(1),
});

export const certCourseClearSchema = z.object({
  certificateId: z.string().min(1),
  courseId: z.string().min(1),
  source: z.string().min(1),
  confidence: z.enum(["published", "estimated"]),
  /**
   * Programs the rule applies to. WGU accepts a certificate for a course in
   * some programs and not others, so an empty list means the rule is not
   * program-specific rather than that it applies nowhere.
   */
  programIds: z.array(z.string()).default([]),
});

/** Courses WGU accepts no transfer credit for, per program. */
export const nonTransferableCourseSchema = z.object({
  courseId: z.string().min(1),
  programIds: z.array(z.string()),
});

/** Sophia / Study.com-style course providers (not industry cert vendors). */
export const transferProviderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export const transferCourseSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  name: z.string().min(1),
  externalCode: z.string().optional(),
});

export const transferCourseClearSchema = z.object({
  transferCourseId: z.string().min(1),
  courseId: z.string().min(1),
  source: z.string().min(1),
  confidence: z.enum(["published", "estimated"]),
});

/** A single student's account of how long a course took. */
export const courseTimeReportSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  /** Absent when the post is worth reading but never states a duration. */
  days: z.number().positive().optional(),
  /**
   * Day the report was posted, `YYYY-MM-DD`. Absent when the listing that
   * turned it up no longer carries it. Courses change, so a reader needs to
   * know whether an account is from this year or five years ago.
   */
  postedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

/**
 * Community-reported clear time for one course. Self-reported and
 * self-selecting: people post when they pass quickly, so `reportCount` travels
 * with the estimate and the UI must show it.
 */
export const courseTimeSchema = z.object({
  courseId: z.string().min(1),
  /** How many reports state a duration; may be 0 while `reports` is not empty. */
  reportCount: z.number().int().nonnegative(),
  /** Median rather than mean: these distributions have long right tails. */
  medianDays: z.number().positive().optional(),
  lowDays: z.number().positive().optional(),
  highDays: z.number().positive().optional(),
  reports: z.array(courseTimeReportSchema),
});

export const degreeRuleSchema = z.object({
  kind: degreeKindSchema,
  clearsCategories: z.array(courseCategorySchema),
  notes: z.string(),
});

export const catalogMetaSchema = z.object({
  fetchedAt: z.string(),
  sources: z.array(
    z.object({
      name: z.string(),
      url: z.string().url(),
    }),
  ),
});

export const catalogSchema = z.object({
  meta: catalogMetaSchema,
  providers: z.array(providerSchema),
  certificates: z.array(certificateSchema),
  programs: z.array(programSchema),
  courses: z.array(courseSchema),
  programCertEligibility: z.array(programCertEligibilitySchema),
  certCourseClears: z.array(certCourseClearSchema),
  nonTransferableCourses: z.array(nonTransferableCourseSchema).default([]),
  transferProviders: z.array(transferProviderSchema).default([]),
  transferCourses: z.array(transferCourseSchema).default([]),
  transferCourseClears: z.array(transferCourseClearSchema).default([]),
  courseTimes: z.array(courseTimeSchema).default([]),
  degreeRules: z.array(degreeRuleSchema),
});

export type CourseCategory = z.infer<typeof courseCategorySchema>;
export type DegreeKind = z.infer<typeof degreeKindSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type Certificate = z.infer<typeof certificateSchema>;
export type Program = z.infer<typeof programSchema>;
export type Course = z.infer<typeof courseSchema>;
export type ProgramCertEligibility = z.infer<
  typeof programCertEligibilitySchema
>;
export type CertCourseClear = z.infer<typeof certCourseClearSchema>;
export type NonTransferableCourse = z.infer<typeof nonTransferableCourseSchema>;
export type TransferProvider = z.infer<typeof transferProviderSchema>;
export type TransferCourse = z.infer<typeof transferCourseSchema>;
export type TransferCourseClear = z.infer<typeof transferCourseClearSchema>;
export type CourseTimeReport = z.infer<typeof courseTimeReportSchema>;
export type CourseTime = z.infer<typeof courseTimeSchema>;
export type DegreeRule = z.infer<typeof degreeRuleSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
