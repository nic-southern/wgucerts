import type { SeedCourse } from "./course-seed";
import {
  categorizeCourse,
  type CatalogProgramCourses,
} from "./parse-institutional-catalog";

export type BuiltCourse = {
  id: string;
  code: string;
  name: string;
  cu?: number;
  category: SeedCourse["category"];
  programIds: string[];
};

export type ProgramRef = {
  id: string;
  /** WGU program code, used to find the program's catalog course table. */
  code: string;
};

export function buildCoursesFromCatalog(
  programs: ProgramRef[],
  catalogPrograms: CatalogProgramCourses[],
): {
  courses: BuiltCourse[];
  programCourseIds: Map<string, string[]>;
  programTotalCus: Map<string, number>;
  /** Programs with no course table in the institutional catalog. */
  programsWithoutCourses: ProgramRef[];
} {
  const courseByCode = new Map<string, BuiltCourse>();
  const programCourseIds = new Map<string, string[]>();
  const programTotalCus = new Map<string, number>();
  const tableByCode = new Map(
    catalogPrograms.map((table) => [table.programCode, table]),
  );

  const addCourse = (programId: string, seed: SeedCourse, ids: string[]) => {
    const id = `course:${seed.code.toLowerCase()}`;
    const existing = courseByCode.get(id);
    if (existing) {
      if (!existing.programIds.includes(programId)) {
        existing.programIds.push(programId);
      }
      if (existing.cu == null && seed.cu != null) existing.cu = seed.cu;
      // Prefer longer / more specific names from catalog
      if (seed.name.length > existing.name.length) existing.name = seed.name;
      if (existing.category === "unknown" && seed.category !== "unknown") {
        existing.category = seed.category;
      }
    } else {
      courseByCode.set(id, {
        id,
        code: seed.code,
        name: seed.name,
        cu: seed.cu,
        category: seed.category,
        programIds: [programId],
      });
    }
    ids.push(id);
  };

  const programsWithoutCourses: ProgramRef[] = [];

  for (const program of programs) {
    const table = tableByCode.get(program.code);
    if (!table) {
      programsWithoutCourses.push(program);
      continue;
    }

    const ids: string[] = [];
    for (const row of table.courses) {
      addCourse(
        program.id,
        {
          code: row.code,
          name: row.name,
          cu: row.cu,
          category: categorizeCourse(row.name),
        },
        ids,
      );
    }
    programCourseIds.set(program.id, ids);
    programTotalCus.set(
      program.id,
      table.totalCus ?? table.courses.reduce((n, c) => n + c.cu, 0),
    );
  }

  return {
    courses: [...courseByCode.values()],
    programCourseIds,
    programTotalCus,
    programsWithoutCourses,
  };
}
