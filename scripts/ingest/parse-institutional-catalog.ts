export type CatalogCourseRow = {
  code: string;
  name: string;
  cu: number;
  term?: number;
  ccn?: string;
};

export type CatalogProgramCourses = {
  /** WGU program code the table belongs to, e.g. `BSCSIA`. */
  programCode: string;
  totalCus?: number;
  courses: CatalogCourseRow[];
};

/**
 * Course tables carry a title rather than a program code, and the two Software
 * Engineering tracks share their title word for word. A table is therefore
 * identified by its heading plus, where needed, a course only one track lists.
 */
const PROGRAM_TABLE_MATCHERS: {
  code: string;
  heading: RegExp;
  requires?: RegExp;
}[] = [
  {
    code: "BSCNEAWS",
    heading:
      /^Bachelor of Science, Cloud and Network Engineering - Amazon Web Services\b/i,
  },
  {
    code: "BSCNEAZR",
    heading:
      /^Bachelor of Science, Cloud and Network Engineering - Microsoft Azure\b/i,
  },
  {
    code: "BSCNECIS",
    heading: /^Bachelor of Science, Cloud and Network Engineering - Cisco\b/i,
  },
  {
    code: "BSCNE",
    heading: /^Bachelor of Science, Cloud and Network Engineering\b/i,
  },
  {
    code: "BSCSIA",
    heading: /^Bachelor of Science, Cybersecurity and Information Assurance\b/i,
  },
  { code: "BSAIE", heading: /^Bachelor of Science, AI Engineering\b/i },
  {
    code: "BSCS",
    heading: /^Bachelor of Science, Computer Science\b(?!\s*\()/i,
  },
  { code: "BSDA", heading: /^Bachelor of Science, Data Analytics\b/i },
  {
    code: "MSITUG",
    heading:
      /^Bachelor of Science, Information Technology\s*\(BSIT to MSIT\)/i,
  },
  {
    code: "BSIT",
    heading: /^Bachelor of Science, Information Technology\b(?!\s*\()/i,
  },
  {
    code: "BSSWE_C",
    heading: /^Bachelor of Science, Software Engineering\b(?!\s*\()/i,
    requires: /Software I\s*[–\-]\s*C#/i,
  },
  {
    code: "BSSWE",
    heading: /^Bachelor of Science, Software Engineering\b(?!\s*\()/i,
    requires: /Java Fundamentals/i,
  },
];

/**
 * Course row: CCN CODE Name CUs Term
 * Example: ITEC 2012 E004 Introduction to IT 3 1
 */
const COURSE_ROW_RE =
  /\b([A-Z]{2,6})\s+(\d{4})\s+([A-Z]\d{3,4})\s+([A-Z][A-Za-z0-9:'’()\/,&+.\- ]{2,90}?)\s+(\d{1,2})\s+(\d{1,2})\b/g;

const GEN_ED_NAME =
  /composition|communication|critical thinking|american politics|ethics in technology|applied algebra|applied probability|natural science|health, fitness|us history|integrated physical|systems thinking|influential communication|discrete math/i;

const FOUNDATIONS_NAME =
  /introduction to it|it foundations|it applications|network and security - foundations|network and security – foundations|scripting and programming|linux foundations|fundamentals of information security|web development foundations|version control|foundations of programming/i;

export function categorizeCourse(
  name: string,
): "genEd" | "foundations" | "core" {
  if (GEN_ED_NAME.test(name)) return "genEd";
  if (FOUNDATIONS_NAME.test(name)) return "foundations";
  return "core";
}

function normalizeName(name: string): string {
  return name
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*/g, " – ")
    .replace(/\s*©.*$/i, "")
    .trim();
}

function extractTableBlock(section: string): string | null {
  const start =
    section.search(/CCN\s+Course\s+Number\s+Course\s+Description\s+CUs\s+Term/i);
  if (start < 0) return null;
  const fromHeader = section.slice(start);
  const totalIdx = fromHeader.search(/Total CUs:\s*\d+/i);
  if (totalIdx < 0) {
    // Fall back to a bounded window after the header
    return fromHeader.slice(0, 6000);
  }
  return fromHeader.slice(0, totalIdx + 40);
}

function extractCoursesFromTable(table: string): {
  courses: CatalogCourseRow[];
  totalCus?: number;
} {
  const courses: CatalogCourseRow[] = [];
  const seen = new Set<string>();
  const compact = table.replace(/\r/g, " ").replace(/\n/g, " ");

  for (const match of compact.matchAll(COURSE_ROW_RE)) {
    const ccn = `${match[1]} ${match[2]}`;
    const code = match[3];
    const name = normalizeName(match[4]);
    const cu = Number(match[5]);
    const term = Number(match[6]);
    if (!name || name.length < 3 || name.length > 100) continue;
    if (/total cus|western governors|course description/i.test(name)) continue;
    if (Number.isNaN(cu) || cu < 1 || cu > 12) continue;
    if (Number.isNaN(term) || term < 1 || term > 20) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    courses.push({ code, name, cu, term, ccn });
  }

  const totalMatch = compact.match(/Total CUs:\s*(\d+)/i);
  const totalCus = totalMatch ? Number(totalMatch[1]) : undefined;
  return { courses, totalCus };
}

/**
 * Parse School of Technology bachelor course tables from institutional catalog text.
 */
export function parseInstitutionalCatalogText(
  text: string,
): CatalogProgramCourses[] {
  // Split on every Bachelor of Science header so sections stay bounded.
  const parts = text.split(/(?=^Bachelor of Science,)/im);
  const results: CatalogProgramCourses[] = [];
  const seenCodes = new Set<string>();

  for (const part of parts) {
    const firstLine = part.split(/\n/, 1)[0]?.trim() ?? "";
    if (!/^Bachelor of Science,/i.test(firstLine)) continue;

    const table = extractTableBlock(part);
    if (!table) continue;

    const matcher = PROGRAM_TABLE_MATCHERS.find(
      (m) =>
        !seenCodes.has(m.code) &&
        m.heading.test(firstLine) &&
        (!m.requires || m.requires.test(table)),
    );
    if (!matcher) continue;

    const { courses, totalCus } = extractCoursesFromTable(table);
    // Real SoT bachelor paths are roughly 25–45 courses; reject junk parses.
    if (courses.length < 15 || courses.length > 55) continue;

    seenCodes.add(matcher.code);
    results.push({
      programCode: matcher.code,
      totalCus,
      courses,
    });
  }

  return results;
}
