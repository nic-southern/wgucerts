import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseTransferableCertsHtml } from "./parse-transferable-certs";

describe("parseTransferableCertsHtml", () => {
  it("parses accordion program panels into provider/cert eligibility", () => {
    const fixture = `
      <h2>School of Technology</h2>
      <div class="cmp-accordion__item">
        <h3 class="cmp-accordion__header">B.S. Information Technology</h3>
        <div class="cmp-accordion__panel">
          <div class="text">
            <p>CompTIA</p>
            <ul>
              <li>CompTIA Network+</li>
              <li>CompTIA Security+</li>
            </ul>
            <p>CISCO</p>
            <ul>
              <li>CCNA (Cisco Certified Network Associate)</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    const parsed = parseTransferableCertsHtml(fixture);
    expect(parsed.programs).toHaveLength(1);
    expect(parsed.providers.map((p) => p.name).sort()).toEqual([
      "CISCO",
      "CompTIA",
    ]);
    expect(parsed.certificates).toHaveLength(3);
    expect(parsed.eligibility).toHaveLength(3);
  });

  it("loads committed catalog snapshot shape", () => {
    const raw = readFileSync(
      path.resolve(process.cwd(), "data/catalog/catalog.json"),
      "utf8",
    );
    const json = JSON.parse(raw) as {
      certificates: unknown[];
      programCertEligibility: unknown[];
    };
    expect(json.certificates.length).toBeGreaterThan(50);
    expect(json.programCertEligibility.length).toBeGreaterThan(100);
  });
});
