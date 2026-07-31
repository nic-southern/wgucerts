import { z } from "zod";
import { degreeKindSchema } from "@/lib/catalog/schema";

export const PROFILE_STORAGE_KEY = "wgucerts.profile.v2";

/** Read once and migrated forward so nobody loses what they already entered. */
export const LEGACY_PROFILE_STORAGE_KEY = "wgucerts.profile.v1";

export const priorDegreeSchema = z.union([
  z.literal("none"),
  degreeKindSchema,
]);

export const userProfileSchema = z.object({
  selectedProgramId: z.string().nullable(),
  priorDegree: priorDegreeSchema,
  certificateIds: z.array(z.string()),
  /** WGU courses marked done, whether passed at WGU or transferred in. */
  completedCourseIds: z.array(z.string()).default([]),
  /** Sophia / Study.com courses finished, which clear the WGU courses they map to. */
  completedTransferCourseIds: z.array(z.string()).default([]),
});

export const legacyUserProfileSchema = z.object({
  selectedProgramId: z.string().nullable(),
  priorDegree: priorDegreeSchema,
  certificateIds: z.array(z.string()),
});

export type PriorDegree = z.infer<typeof priorDegreeSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;

export const defaultProfile: UserProfile = {
  selectedProgramId: null,
  priorDegree: "none",
  certificateIds: [],
  completedCourseIds: [],
  completedTransferCourseIds: [],
};

export function migrateLegacyProfile(raw: unknown): UserProfile | null {
  const parsed = legacyUserProfileSchema.safeParse(raw);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    completedCourseIds: [],
    completedTransferCourseIds: [],
  };
}
