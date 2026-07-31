/**
 * Resolves certification names written in WGU guideline prose (e.g. "CompTIA:
 * Network+, Security+; Cisco: any CCNP") to certificate records in the catalog.
 *
 * Matching is key-based rather than regex-based: both the catalog name and the
 * guideline mention are reduced to a set of keys (name, parenthetical acronym,
 * plus-suffixed token, vendor exam code) and compared. Keys are whole tokens, so
 * "Data+" can never match "A+".
 */

export type CertRecord = {
  id: string;
  providerId: string;
  name: string;
};

export type ProviderRecord = {
  id: string;
  name: string;
};

/** Vendor labels used in guideline prose → provider name in the catalog. */
const VENDOR_ALIASES: { match: RegExp; providerMatch: RegExp }[] = [
  { match: /^comptia$/i, providerMatch: /^comptia$/i },
  { match: /^cisco$/i, providerMatch: /^cisco$/i },
  { match: /^(ecc|ec-?council)$/i, providerMatch: /^ec council$/i },
  { match: /^giac$/i, providerMatch: /^giac$/i },
  { match: /^lpi$/i, providerMatch: /linux professional institute/i },
  { match: /^linux foundation$/i, providerMatch: /^the linux foundation$/i },
  { match: /^red hat$/i, providerMatch: /^red hat$/i },
  { match: /^oracle$/i, providerMatch: /^oracle$/i },
  { match: /^microsoft$/i, providerMatch: /^microsoft$/i },
  { match: /^(aws|amazon web services)$/i, providerMatch: /amazon web services/i },
  { match: /^google$/i, providerMatch: /google/i },
  { match: /^isc2$/i, providerMatch: /^\(isc\)2$/i },
  { match: /^isaca$/i, providerMatch: /^isaca$/i },
  { match: /^pmi$/i, providerMatch: /^pmi$/i },
  { match: /^itil$/i, providerMatch: /^itil$/i },
  { match: /^axelos$/i, providerMatch: /^itil$/i },
  { match: /^(offensive security|offsec)$/i, providerMatch: /^offensive security$/i },
  { match: /^python institute$/i, providerMatch: /^python institute$/i },
];

/**
 * Vendor names appear inside certificate names too ("GIAC Certified Intrusion
 * Analyst"). Excluding them keeps a bare vendor mention from matching that
 * vendor's whole catalog.
 */
const VENDOR_TOKENS = new Set([
  "comptia",
  "cisco",
  "giac",
  "lpi",
  "ciw",
  "isc",
  "isaca",
  "pmi",
  "aws",
  "ecc",
  "dasca",
  "cap",
  "udacity",
  "oracle",
  "microsoft",
  "google",
  "wgu",
]);

/** Trailing nouns that add nothing to a certificate's identity. */
const TRAILING_NOISE =
  /\s+(certifications?|certificates?|certified|designations?|exams?|credentials?|certs?)$/i;

export function normalizeCertText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u00a0\u2007\u202f]/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** Vendor and provider names disagree on punctuation: "ISC(2)" for "(ISC)2". */
function compactAlphanumeric(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

function stripTrailingNoise(value: string): string {
  let out = value;
  for (let i = 0; i < 3; i += 1) {
    const next = out.replace(TRAILING_NOISE, "").trim();
    if (next === out) break;
    out = next;
  }
  return out;
}

/**
 * Name-shaped keys: the strongest signal, used in preference to acronyms so
 * "Certified Cloud Security Professional" picks the real CCSP over
 * "Associate of (ISC)2 Designation CCSP".
 */
function nameKeys(rawName: string): Set<string> {
  const keys = new Set<string>();
  const normalized = normalizeCertText(rawName);
  const add = (value: string) => {
    const key = stripTrailingNoise(value.replace(/[().,]/g, " ").replace(/\s+/g, " ").trim());
    if (key.length >= 3) keys.add(key);
  };

  add(normalized);

  for (const match of normalized.matchAll(/\(([^)]+)\)/g)) {
    if (/^except\b/i.test(match[1])) continue;
    add(match[1]);
  }

  const withoutParens = normalized.replace(/\([^)]*\)/g, " ");
  add(withoutParens);

  // Drop a leading vendor word so "CompTIA Linux+" keys as "linux+".
  const words = withoutParens.trim().split(/\s+/);
  if (words.length > 1 && VENDOR_TOKENS.has(words[0].replace(/[^a-z0-9]/g, ""))) {
    add(words.slice(1).join(" "));
  }

  return keys;
}

/** Acronym / plus-token / exam-code keys. Weaker than name keys. */
function symbolKeys(rawName: string): Set<string> {
  const keys = new Set<string>();
  const normalized = normalizeCertText(rawName);

  // Plus-suffixed products: a+, network+, cysa+, casp+.
  for (const match of normalized.matchAll(/(?:^|[\s(:/])([a-z][a-z0-9]{0,9}\+)/g)) {
    keys.add(match[1]);
  }

  // Vendor exam codes: 1z0-106, az-104, dp-203, 220-1101.
  for (const match of normalized.matchAll(/\b([a-z]{0,3}\d?z?\d?-?\d{3,4})\b/g)) {
    if (!/\d/.test(match[1]) || !/-/.test(match[1])) continue;
    keys.add(match[1]);
    // Guidelines drop the hyphen: "exam DP300" for "DP-300".
    keys.add(match[1].replace(/-/g, ""));
  }

  // LPIC levels, written inconsistently as "LPIC-1", "LPIC- 1", "LPIC – 3".
  for (const match of normalized.matchAll(/\blpic-?\s*(\d)\b/g)) {
    keys.add(`lpic-${match[1]}`);
  }

  // All-caps acronyms in the original casing: LFCS, RHCSA, CCNA, GSEC.
  for (const match of rawName.matchAll(/\b([A-Z][A-Z0-9]{1,7})\b/g)) {
    const key = match[1].toLowerCase();
    if (VENDOR_TOKENS.has(key)) continue;
    keys.add(key);
  }

  // In a levelled family the level is part of the identity, so the bare family
  // acronym must not match: LPIC-1 is not interchangeable with LPIC-3.
  for (const key of [...keys]) {
    const family = key.match(/^([a-z]+)-\d$/);
    if (family) keys.delete(family[1]);
  }

  return keys;
}

export type CertKeys = {
  name: Set<string>;
  symbol: Set<string>;
};

export function certKeys(rawName: string): CertKeys {
  return { name: nameKeys(rawName), symbol: symbolKeys(rawName) };
}

function intersects(a: Set<string>, b: Set<string>): boolean {
  for (const value of a) if (b.has(value)) return true;
  return false;
}

/** Filler words carry no identity, so they are excluded from token comparison. */
const TOKEN_STOPWORDS = new Set(["the", "of", "in", "and", "for", "a", "an"]);

function nameTokens(rawName: string): string[] {
  return stripTrailingNoise(normalizeCertText(rawName))
    .replace(/[()]/g, " ")
    .split(/[\s-]+/)
    .map((token) => token.replace(/[^a-z0-9+]/g, ""))
    // Guidelines and certificate names disagree on number ("ITIL foundations"
    // for "ITIL Foundation"). Both sides are compared, so this stays symmetric.
    .map((token) => (token.length > 4 ? token.replace(/s$/, "") : token))
    .filter(
      (token) =>
        token.length > 1 && !TOKEN_STOPWORDS.has(token) && !VENDOR_TOKENS.has(token),
    );
}

export type CertMention = {
  /** Text as written in the source document. */
  text: string;
  /** Vendor label the mention was listed under, if any. */
  vendor?: string;
};

export type CertResolution = {
  mention: CertMention;
  certificateIds: string[];
};

export type CertResolver = {
  resolve: (mention: CertMention) => CertResolution;
};

/**
 * Vendor labels as they appear at the head of a list item. WGU writes these
 * three ways in the same document: "CompTIA: Linux+", "EC-Council - CEH", and
 * "ISC(2) CC".
 */
const VENDOR_LABEL_RE = new RegExp(
  `^(comptia|cisco|ec[\\s-]?council|ecc|giac|lpi|linux foundation|red hat|oracle|microsoft|aws|amazon web services|google|\\(?isc\\)?\\s*\\(?2\\)?|isaca|pmi|itil|axelos|offensive security|offsec|python institute|cloud security alliance|csa|scrum alliance|scrum\\.org|udacity|dasca|ciw|wgu)(?![a-z0-9+])(?:['’]s)?[\\s:.\\-–—)]*(.*)$`,
  "is",
);

/** Leading filler before a cert name: "or the CompTIA A+", "any CCIE". */
const LEADING_FILLER_RE = /^(?:or|and|the|any|an|either)\s+/i;

/** Narrative prose that leaked into a cert list is far wordier than a cert name. */
const MAX_MENTION_WORDS = 12;

/** Splits on separators at paren depth zero so "(except collaboration)" survives. */
export function splitTopLevel(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  const push = () => {
    if (current.trim()) parts.push(current.trim());
    current = "";
  };

  for (let i = 0; i < list.length; i += 1) {
    const char = list[i];
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);

    if (depth === 0) {
      if (char === ";" || char === ",") {
        push();
        continue;
      }
      // A sentence break can also start a new vendor group: ". GIAC: GSE".
      if (char === "." && /^\s+[A-Z]/.test(list.slice(i + 1, i + 3))) {
        push();
        continue;
      }
      if (/\s/.test(char) && /\bor$/i.test(current)) {
        current = current.replace(/\bor$/i, "");
        push();
        continue;
      }
    }
    current += char;
  }
  push();

  return parts;
}

/**
 * Splits a vendor-grouped cert list into individual mentions, carrying the
 * current vendor forward until a new one is named.
 */
export function parseCertMentions(list: string): CertMention[] {
  const mentions: CertMention[] = [];
  const flattened = list.replace(/\s+/g, " ").trim();
  let vendor: string | undefined;

  // Text extraction sometimes loses the separator between two certifications,
  // leaving "...Analyst (GCFA) GIAC Certified...Examiner (GCFE)" as one item. A
  // closing paren with more text after it is that seam.
  const parts = splitTopLevel(flattened).flatMap((part) =>
    part.split(/(?<=\))\s+(?=\S)/),
  );

  for (const part of parts) {
    // Strip filler before looking for a vendor, so "or the CompTIA ITF+" is
    // recognized as CompTIA rather than inheriting the previous vendor.
    let text = part
      .replace(/^[\s:.\-–—]+|[\s.\-–—]+$/g, "")
      .replace(LEADING_FILLER_RE, "")
      .trim();

    // A nested list header starts a new family, so the carried vendor no longer
    // applies: "CompTIA Data+, or the following Certified analytics
    // professional certifications: CAP-E".
    const nestedHeader = text.match(/^.*\bcertificat\w*\s*:\s*/i);
    if (nestedHeader) {
      vendor = undefined;
      text = text.slice(nestedHeader[0].length).trim();
    }

    const vendorMatch = text.match(VENDOR_LABEL_RE);
    if (vendorMatch) {
      vendor = vendorMatch[1].trim();
      text = vendorMatch[2].trim();
    }

    text = stripTrailingNoise(
      text
        .replace(LEADING_FILLER_RE, "")
        .replace(/^[\s:.\-–—]+|[\s.\-–—]+$/g, "")
        .trim(),
    );

    if (text.length < 2) continue;
    if (/^(certifications?|certificates?|following|exams?)$/i.test(text)) continue;
    // Qualifiers that trail a cert name: "PSM level I or above".
    if (/^(above|below|higher|level\s+[ivx\d]+)$/i.test(text)) continue;
    if (text.split(/\s+/).length > MAX_MENTION_WORDS) continue;

    mentions.push(vendor ? { text, vendor } : { text });
  }

  return mentions;
}

export function createCertResolver(
  certificates: CertRecord[],
  providers: ProviderRecord[],
): CertResolver {
  const providerById = new Map(providers.map((p) => [p.id, p]));
  const indexed = certificates.map((cert) => ({
    cert,
    providerName: providerById.get(cert.providerId)?.name ?? "",
    keys: certKeys(cert.name),
  }));

  /**
   * Narrows candidates to one vendor. Known labels use the fixed alias
   * patterns; an unknown label is compared with punctuation stripped from both
   * sides, so that "Scrum.org" still finds "Scrum.org" and no pattern is ever
   * compiled from document text.
   */
  const resolveProviderFilter = (
    vendor?: string,
  ): ((providerName: string) => boolean) | undefined => {
    if (!vendor) return undefined;
    // Vendors are written with stray punctuation: "ISC(2)", "(ISC)2", "ISC2".
    const plain = vendor.replace(/[^A-Za-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
    const compact = compactAlphanumeric(vendor);
    const alias = VENDOR_ALIASES.find(
      (v) => v.match.test(plain) || v.match.test(compact),
    );
    if (alias) return (providerName) => alias.providerMatch.test(providerName);
    if (compact.length === 0) return undefined;
    return (providerName) => compactAlphanumeric(providerName).includes(compact);
  };

  return {
    resolve(mention) {
      const providerFilter = resolveProviderFilter(mention.vendor);
      const exceptMatch = mention.text.match(/\(\s*except\s+([^)]+)\)/i);
      const excluded = exceptMatch
        ? normalizeCertText(exceptMatch[1]).split(/\s*(?:,|and|or)\s*/).filter(Boolean)
        : [];

      const cleaned = mention.text.replace(/\(\s*except[^)]*\)/i, " ").trim();
      const mentionKeys = certKeys(cleaned);

      // A trailing qualifier ("CCNP – Security") narrows a family match.
      const qualifierMatch = cleaned.match(/^(.*?)-\s*([A-Za-z][A-Za-z\s]{2,30})$/);
      const qualifier = qualifierMatch
        ? normalizeCertText(qualifierMatch[2])
        : undefined;

      const scoped = providerFilter
        ? indexed.filter((entry) => providerFilter(entry.providerName))
        : indexed;

      const byName = scoped.filter((entry) =>
        intersects(entry.keys.name, mentionKeys.name),
      );
      const bySymbol = scoped.filter(
        (entry) =>
          intersects(entry.keys.symbol, mentionKeys.symbol) ||
          intersects(entry.keys.symbol, mentionKeys.name) ||
          intersects(entry.keys.name, mentionKeys.symbol),
      );

      let matches = byName.length > 0 ? byName : bySymbol;

      // WGU sometimes shortens a name ("AWS Certified Practitioner" for "AWS
      // Certified Cloud Practitioner"). Allow a token-subset match, but only
      // within a named vendor, and prefer the closest name.
      if (matches.length === 0 && providerFilter) {
        const wanted = nameTokens(cleaned);
        if (wanted.length > 0) {
          const subset = scoped
            .map((entry) => ({ entry, tokens: nameTokens(entry.cert.name) }))
            .filter(({ tokens }) => wanted.every((token) => tokens.includes(token)))
            .sort((a, b) => a.tokens.length - b.tokens.length);
          const fewest = subset[0]?.tokens.length;
          matches = subset
            .filter(({ tokens }) => tokens.length === fewest)
            .map(({ entry }) => entry);
        }
      }

      // A named exam part is not interchangeable with another part.
      const part = cleaned.match(/\bcore\s*(\d)\b/i);
      if (part) {
        matches = matches.filter((entry) => {
          const other = entry.cert.name.match(/\bcore\s*(\d)\b/i);
          return !other || other[1] === part[1];
        });
      }

      if (qualifier && matches.length > 1) {
        const narrowed = matches.filter((entry) =>
          normalizeCertText(entry.cert.name).includes(qualifier),
        );
        if (narrowed.length > 0) matches = narrowed;
      }

      if (excluded.length > 0) {
        matches = matches.filter((entry) => {
          const name = normalizeCertText(entry.cert.name);
          return !excluded.some((term) => term.length > 2 && name.includes(term));
        });
      }

      return {
        mention,
        certificateIds: [...new Set(matches.map((entry) => entry.cert.id))].sort(),
      };
    },
  };
}
