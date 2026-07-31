import { z } from "zod";

/**
 * WGU publishes its transfer guidelines through the same public endpoints that
 * back partners.wgu.edu. These carry every course/certification rule the
 * partner site shows, keyed by numeric program id, and are refreshed far more
 * often than the downloadable guideline documents.
 */
const API_BASE = "https://marketing-api-gateway.wgu.edu/partner/v1/public";

const COLLEGE_CODE = "IT";

/** A JSON array smuggled through a string field, e.g. `"[204,253]"`. */
const embeddedNumberArray = z.string().transform((raw, ctx) => {
  try {
    const parsed = JSON.parse(raw);
    return z.array(z.number()).parse(parsed);
  } catch {
    ctx.addIssue({ code: "custom", message: `Not a number array: ${raw}` });
    return z.NEVER;
  }
});

const apiProgramSchema = z.object({
  id: z.number(),
  pamsProgramCode: z.string().min(1),
  programName: z.string().min(1),
  approvalStatus: z.string(),
  inactiveProgram: z.number(),
});

const apiGuidelineRowSchema = z.object({
  id: z.number(),
  PAMS_bannerCode: z.string(),
  transferArea: z.string(),
  guidelinesGroup: z.string().default(""),
  transferRequirements: z.string().default(""),
  programs: embeddedNumberArray,
});

export type ApiProgram = {
  /** Numeric id used to key guideline rules. */
  apiId: number;
  /** WGU's program code, e.g. `BSCSIA`. Stable across catalog revisions. */
  code: string;
  /** Program name with the trailing catalog revision removed. */
  name: string;
};

export type ApiGuidelineRow = {
  courseCode: string;
  /** `General Education`, `Core`, `Additional Transfer`, `Non-Transferable`. */
  transferArea: string;
  requirements: string;
  /** Programs the rule applies to; one row can cover several. */
  apiProgramIds: number[];
};

/** WGU appends the catalog revision to display names: "BS Data Analytics (Catalog 09-2023)". */
const CATALOG_SUFFIX_RE = /\s*\(Catalog\s+[^)]*\)\s*$/i;

/** Match the "B.S." styling the rest of the catalog uses. */
function displayName(programName: string): string {
  return programName
    .replace(CATALOG_SUFFIX_RE, "")
    .replace(/^BS\b/, "B.S.")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * The IT program list includes superseded and not-yet-live catalog revisions of
 * the same degree. Only `Approved` rows are the ones partners.wgu.edu offers,
 * so filtering on it keeps us in step with WGU as new catalogs go live.
 */
export async function fetchLiveItPrograms(): Promise<ApiProgram[]> {
  const raw = await fetchJson(`${API_BASE}/program/college/${COLLEGE_CODE}`);
  const programs = z.array(apiProgramSchema).parse(raw);
  return programs
    .filter((p) => p.approvalStatus === "Approved" && p.inactiveProgram === 0)
    .map((p) => ({
      apiId: p.id,
      code: p.pamsProgramCode,
      name: displayName(p.programName),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchTransferGuidelines(
  apiProgramId: number,
): Promise<ApiGuidelineRow[]> {
  const raw = await fetchJson(
    `${API_BASE}/transfer-guidelines/programs?programsCode=${apiProgramId}`,
  );
  return z
    .array(apiGuidelineRowSchema)
    .parse(raw)
    .filter((row) => row.PAMS_bannerCode.trim().length > 0)
    .map((row) => ({
      courseCode: row.PAMS_bannerCode.trim().toUpperCase(),
      transferArea: row.transferArea.trim(),
      requirements: row.transferRequirements,
      apiProgramIds: row.programs,
    }));
}

export const PARTNER_GUIDELINES_URL =
  "https://partners.wgu.edu/general-transfer-guidelines";
