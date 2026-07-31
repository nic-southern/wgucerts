/**
 * Alternate-credit course packs (Sophia / Study.com) → WGU course clears.
 * Matched by WGU course title (normalized) during ingest.
 *
 * Sophia mappings from the WGU College of IT Sophia partner page.
 * Study.com mappings are thinner starter data — confirm on partners.wgu.edu.
 */

export type TransferSeedProvider = {
  id: string;
  name: string;
};

export type TransferSeedCourse = {
  id: string;
  providerId: string;
  name: string;
  externalCode?: string;
};

export type TransferSeedClear = {
  transferCourseId: string;
  /** Match against WGU catalog course names (case-insensitive contains / normalize). */
  wguNameMatch: RegExp;
  /** Prefer exact code when present in catalog. */
  wguCode?: string;
  source: string;
  confidence: "published" | "estimated";
};

export const TRANSFER_PROVIDERS: TransferSeedProvider[] = [
  { id: "transfer:sophia", name: "Sophia" },
  { id: "transfer:study-com", name: "Study.com" },
];

export const TRANSFER_COURSES: TransferSeedCourse[] = [
  // Sophia
  {
    id: "transfer:sophia:intro-it",
    providerId: "transfer:sophia",
    name: "Introduction to Information Technology",
    externalCode: "SOPH-0023",
  },
  {
    id: "transfer:sophia:intro-java",
    providerId: "transfer:sophia",
    name: "Introduction to Java Programming",
    externalCode: "SOPH-0062",
  },
  {
    id: "transfer:sophia:intro-python",
    providerId: "transfer:sophia",
    name: "Introduction to Python Programming",
    externalCode: "SOPH-0058",
  },
  {
    id: "transfer:sophia:intro-databases",
    providerId: "transfer:sophia",
    name: "Introduction to Relational Databases",
    externalCode: "SOPH-0047",
  },
  {
    id: "transfer:sophia:intro-web",
    providerId: "transfer:sophia",
    name: "Introduction to Web Development",
    externalCode: "SOPH-0043",
  },
  {
    id: "transfer:sophia:project-mgmt",
    providerId: "transfer:sophia",
    name: "Project Management",
    externalCode: "SOPH-0013",
  },
  {
    id: "transfer:sophia:principles-mgmt",
    providerId: "transfer:sophia",
    name: "Principles of Management",
    externalCode: "SOPH-0054",
  },
  {
    id: "transfer:sophia:business-comm",
    providerId: "transfer:sophia",
    name: "Business Communication",
    externalCode: "SOPH-0059",
  },
  {
    id: "transfer:sophia:critical-thinking",
    providerId: "transfer:sophia",
    name: "Critical Thinking",
    externalCode: "SOPH-0065",
  },
  {
    id: "transfer:sophia:english-comp-i",
    providerId: "transfer:sophia",
    name: "English Composition I",
    externalCode: "SOPH-0015",
  },
  {
    id: "transfer:sophia:english-comp-ii",
    providerId: "transfer:sophia",
    name: "English Composition II",
    externalCode: "SOPH-0030",
  },
  {
    id: "transfer:sophia:public-speaking",
    providerId: "transfer:sophia",
    name: "Public Speaking",
    externalCode: "SOPH-0024",
  },
  {
    id: "transfer:sophia:workplace-comm",
    providerId: "transfer:sophia",
    name: "Workplace Communication",
    externalCode: "SOPH-0034",
  },
  {
    id: "transfer:sophia:workplace-writing-ii",
    providerId: "transfer:sophia",
    name: "Workplace Writing II",
    externalCode: "SOPH-0049",
  },
  {
    id: "transfer:sophia:college-algebra",
    providerId: "transfer:sophia",
    name: "College Algebra",
    externalCode: "SOPH-0001",
  },
  {
    id: "transfer:sophia:calculus-i",
    providerId: "transfer:sophia",
    name: "Calculus I",
    externalCode: "SOPH-0060",
  },
  {
    id: "transfer:sophia:precalculus",
    providerId: "transfer:sophia",
    name: "Precalculus",
    externalCode: "SOPH-0069",
  },
  {
    id: "transfer:sophia:intro-stats",
    providerId: "transfer:sophia",
    name: "Introduction to Statistics",
    externalCode: "SOPH-0005",
  },
  {
    id: "transfer:sophia:environmental-science",
    providerId: "transfer:sophia",
    name: "Environmental Science",
    externalCode: "SOPH-0016",
  },
  {
    id: "transfer:sophia:human-biology",
    providerId: "transfer:sophia",
    name: "Human Biology",
    externalCode: "SOPH-0002",
  },
  {
    id: "transfer:sophia:human-biology-lab",
    providerId: "transfer:sophia",
    name: "Human Biology Lab",
    externalCode: "SOPH-0067",
  },
  {
    id: "transfer:sophia:intro-chemistry",
    providerId: "transfer:sophia",
    name: "Introduction to Chemistry",
    externalCode: "SOPH-0056",
  },
  {
    id: "transfer:sophia:intro-chemistry-lab",
    providerId: "transfer:sophia",
    name: "Introduction to Chemistry Lab",
    externalCode: "SOPH-0070",
  },
  {
    id: "transfer:sophia:intro-nutrition",
    providerId: "transfer:sophia",
    name: "Introduction to Nutrition",
    externalCode: "SOPH-0063",
  },
  {
    id: "transfer:sophia:health-fitness-wellness",
    providerId: "transfer:sophia",
    name: "Health, Fitness, and Wellness",
    externalCode: "SOPH-0080",
  },
  {
    id: "transfer:sophia:us-government",
    providerId: "transfer:sophia",
    name: "U.S. Government",
    externalCode: "SOPH-0071",
  },
  // Study.com (starter set — verify on partners.wgu.edu)
  {
    id: "transfer:study-com:english-comp",
    providerId: "transfer:study-com",
    name: "English Composition",
  },
  {
    id: "transfer:study-com:intro-stats",
    providerId: "transfer:study-com",
    name: "Introduction to Statistics",
  },
  {
    id: "transfer:study-com:college-algebra",
    providerId: "transfer:study-com",
    name: "College Algebra",
  },
  {
    id: "transfer:study-com:intro-computing",
    providerId: "transfer:study-com",
    name: "Introduction to Computing",
  },
  {
    id: "transfer:study-com:project-mgmt",
    providerId: "transfer:study-com",
    name: "Project Management",
  },
];

const SOPHIA_SOURCE =
  "Sophia WGU College of IT transfer chart (confirm on WGU Transfer Pathways)";
const STUDY_SOURCE =
  "Common Study.com → WGU mapping (confirm on partners.wgu.edu)";

export const TRANSFER_CLEARS: TransferSeedClear[] = [
  {
    transferCourseId: "transfer:sophia:intro-it",
    wguNameMatch: /^introduction to it$/i,
    wguCode: "D322",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:intro-java",
    wguNameMatch: /scripting and programming/i,
    wguCode: "D278",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:intro-python",
    wguNameMatch: /introduction to programming in python|foundations of programming \(python\)/i,
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:intro-databases",
    wguNameMatch: /data management – foundations|data management - foundations/i,
    wguCode: "D426",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:intro-web",
    wguNameMatch: /web development foundations/i,
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:project-mgmt",
    wguNameMatch: /business of it – project management|business of it - project management/i,
    wguCode: "D324",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:principles-mgmt",
    wguNameMatch: /it leadership foundations/i,
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:business-comm",
    wguNameMatch: /introduction to communication/i,
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:public-speaking",
    wguNameMatch: /introduction to communication/i,
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:workplace-comm",
    wguNameMatch: /introduction to communication/i,
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:critical-thinking",
    wguNameMatch: /critical thinking/i,
    wguCode: "D265",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:english-comp-i",
    wguNameMatch: /composition:\s*successful self\s*-?\s*expression|^english composition i$/i,
    wguCode: "D270",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:english-comp-ii",
    wguNameMatch: /composition:\s*successful self\s*-?\s*expression|^english composition ii$/i,
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:workplace-writing-ii",
    wguNameMatch: /composition:\s*successful self\s*-?\s*expression/i,
    wguCode: "D270",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:college-algebra",
    wguNameMatch: /applied algebra/i,
    wguCode: "C957",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:calculus-i",
    wguNameMatch: /applied algebra/i,
    wguCode: "C957",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:precalculus",
    wguNameMatch: /applied algebra/i,
    wguCode: "C957",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:intro-stats",
    wguNameMatch: /applied probability and statistics/i,
    wguCode: "C955",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:environmental-science",
    wguNameMatch: /integrated physical sciences/i,
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:human-biology",
    wguNameMatch: /integrated physical sciences/i,
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:intro-chemistry",
    wguNameMatch: /integrated physical sciences/i,
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:human-biology-lab",
    wguNameMatch: /natural science lab/i,
    wguCode: "C683",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:intro-chemistry-lab",
    wguNameMatch: /natural science lab/i,
    wguCode: "C683",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:intro-nutrition",
    wguNameMatch: /health, fitness/i,
    wguCode: "C458",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:health-fitness-wellness",
    wguNameMatch: /health, fitness/i,
    wguCode: "C458",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  {
    transferCourseId: "transfer:sophia:us-government",
    wguNameMatch: /american politics|u\.?s\.? constitution/i,
    wguCode: "C963",
    source: SOPHIA_SOURCE,
    confidence: "published",
  },
  // Study.com starters
  {
    transferCourseId: "transfer:study-com:english-comp",
    wguNameMatch: /composition:\s*successful self\s*-?\s*expression|^english composition/i,
    wguCode: "D270",
    source: STUDY_SOURCE,
    confidence: "estimated",
  },
  {
    transferCourseId: "transfer:study-com:intro-stats",
    wguNameMatch: /applied probability and statistics/i,
    wguCode: "C955",
    source: STUDY_SOURCE,
    confidence: "estimated",
  },
  {
    transferCourseId: "transfer:study-com:college-algebra",
    wguNameMatch: /applied algebra/i,
    wguCode: "C957",
    source: STUDY_SOURCE,
    confidence: "estimated",
  },
  {
    transferCourseId: "transfer:study-com:intro-computing",
    wguNameMatch: /^introduction to it$/i,
    wguCode: "D322",
    source: STUDY_SOURCE,
    confidence: "estimated",
  },
  {
    transferCourseId: "transfer:study-com:project-mgmt",
    wguNameMatch: /business of it – project management|business of it - project management/i,
    wguCode: "D324",
    source: STUDY_SOURCE,
    confidence: "estimated",
  },
];
