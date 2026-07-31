import { z } from "zod";
import { degreeKindSchema } from "@/lib/catalog/schema";

export const PROFILE_STORAGE_KEY = "wgucerts.profile.v1";

export const priorDegreeSchema = z.union([
  z.literal("none"),
  degreeKindSchema,
]);

export const userProfileSchema = z.object({
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
};
