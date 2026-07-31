export type SeedCourse = {
  code: string;
  name: string;
  cu?: number;
  category: "genEd" | "foundations" | "core" | "elective" | "unknown";
};

export const DEGREE_RULES = [
  {
    kind: "associates" as const,
    clearsCategories: ["genEd" as const],
    notes:
      "An accredited associate degree typically satisfies liberal arts general education / foundations coursework (except nursing). Confirm with WGU.",
  },
  {
    kind: "associates_it" as const,
    clearsCategories: ["genEd" as const, "foundations" as const],
    notes:
      "An IT-related associate degree may satisfy gen-ed plus IT foundations courses (often within 5 years). Confirm with WGU.",
  },
  {
    kind: "bachelors" as const,
    clearsCategories: ["genEd" as const],
    notes:
      "A prior bachelor’s degree typically satisfies general education requirements. Confirm with WGU.",
  },
];
