export type SeedCourse = {
  code: string;
  name: string;
  cu?: number;
  category: "genEd" | "foundations" | "core" | "elective" | "unknown";
};

/** Gen-ed courses WGU will not mark RS from a prior associate or bachelor’s. */
const DEGREE_EXCLUDES_GEN_ED = ["course:d333"];

export const DEGREE_RULES = [
  {
    kind: "associates" as const,
    clearsCategories: ["genEd" as const],
    excludesCourseIds: DEGREE_EXCLUDES_GEN_ED,
    notes:
      "An accredited associate degree typically satisfies liberal arts general education / foundations coursework (except nursing and courses WGU marks as not degree-satisfiable, e.g. Ethics in Technology). Confirm with WGU.",
  },
  {
    kind: "associates_it" as const,
    clearsCategories: ["genEd" as const, "foundations" as const],
    excludesCourseIds: DEGREE_EXCLUDES_GEN_ED,
    notes:
      "An IT-related associate degree may satisfy gen-ed plus IT foundations courses (often within 5 years), excluding courses WGU marks as not degree-satisfiable. Confirm with WGU.",
  },
  {
    kind: "bachelors" as const,
    clearsCategories: ["genEd" as const],
    excludesCourseIds: DEGREE_EXCLUDES_GEN_ED,
    notes:
      "A prior bachelor’s degree typically satisfies general education requirements, excluding courses WGU marks as not degree-satisfiable (e.g. Ethics in Technology). Confirm with WGU.",
  },
];
