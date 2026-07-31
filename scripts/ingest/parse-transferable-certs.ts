import * as cheerio from "cheerio";
import {
  certificateIdFrom,
  programIdFromName,
  providerIdFromName,
  slugify,
} from "./slug";

export type ParsedCertCatalog = {
  providers: { id: string; name: string }[];
  certificates: {
    id: string;
    providerId: string;
    name: string;
  }[];
  programs: {
    id: string;
    name: string;
    slug: string;
    degreeLevel: "associates" | "bachelors" | "masters" | "accelerated";
  }[];
  eligibility: { programId: string; certificateId: string }[];
};

function degreeLevelFromName(
  name: string,
): "associates" | "bachelors" | "masters" | "accelerated" {
  const lower = name.toLowerCase();
  if (lower.includes("accelerated")) return "accelerated";
  if (lower.startsWith("a.s.") || lower.startsWith("as ")) return "associates";
  if (lower.startsWith("m.s.") || lower.startsWith("master")) return "masters";
  return "bachelors";
}

function isTechnologyBachelor(name: string): boolean {
  const level = degreeLevelFromName(name);
  if (level !== "bachelors") return false;
  if (/information management technology/i.test(name)) return false;
  return true;
}

/**
 * Parse WGU transferable certifications HTML (AEM accordion layout).
 * School of Technology programs are accordion items: h3 title + panel of
 * <p>Provider</p><ul><li>Certificate</li></ul>.
 */
export function parseTransferableCertsHtml(html: string): ParsedCertCatalog {
  const $ = cheerio.load(html);

  const providers = new Map<string, { id: string; name: string }>();
  const certificates = new Map<
    string,
    { id: string; providerId: string; name: string }
  >();
  const programs = new Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
      degreeLevel: "associates" | "bachelors" | "masters" | "accelerated";
    }
  >();
  const eligibility: { programId: string; certificateId: string }[] = [];
  const eligibilityKeys = new Set<string>();

  // Document-order scan: after School of Technology h2, collect accordion items
  // until another School of * h2 (none today — Technology is last).
  let inTechnology = false;
  const techItems: Parameters<typeof $>[0][] = [];

  $("h2, .cmp-accordion__item").each((_, el) => {
    const tag = "name" in el ? String(el.name).toLowerCase() : "";
    if (tag === "h2") {
      const text = $(el).text();
      if (/school of technology/i.test(text)) {
        inTechnology = true;
      } else if (/school of /i.test(text.trim())) {
        inTechnology = false;
      }
      return;
    }
    if (inTechnology) {
      techItems.push(el);
    }
  });

  for (const item of techItems) {
    const $item = $(item);
    const programName = $item
      .find("h3.cmp-accordion__header, h3")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    if (!programName || !isTechnologyBachelor(programName)) continue;

    const programId = programIdFromName(programName);
    programs.set(programId, {
      id: programId,
      name: programName,
      slug: slugify(programName),
      degreeLevel: degreeLevelFromName(programName),
    });

    const panel = $item.find(".cmp-accordion__panel").first();
    const panelRoot = panel.length ? panel : $item;

    panelRoot.find("p").each((_, p) => {
      const providerName = $(p).text().replace(/\s+/g, " ").trim();
      if (!providerName || providerName.length > 100) return;

      const ul = $(p).nextAll("ul").first();
      if (!ul.length) return;
      if ($(p).nextUntil(ul).filter("p").length > 0) return;

      const providerId = providerIdFromName(providerName);
      providers.set(providerId, { id: providerId, name: providerName });

      ul.children("li").each((__, li) => {
        const certName = $(li).text().replace(/\s+/g, " ").trim();
        if (!certName) return;
        const certificateId = certificateIdFrom(providerId, certName);
        certificates.set(certificateId, {
          id: certificateId,
          providerId,
          name: certName,
        });
        const key = `${programId}::${certificateId}`;
        if (!eligibilityKeys.has(key)) {
          eligibilityKeys.add(key);
          eligibility.push({ programId, certificateId });
        }
      });
    });
  }

  return {
    providers: [...providers.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    certificates: [...certificates.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    programs: [...programs.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    eligibility,
  };
}
