import { describe, expect, it } from "vitest";
import {
  createCertResolver,
  parseCertMentions,
  type CertRecord,
  type ProviderRecord,
} from "./cert-match";

const providers: ProviderRecord[] = [
  { id: "provider:comptia", name: "CompTIA" },
  { id: "provider:cisco", name: "CISCO" },
  { id: "provider:ec-council", name: "EC Council" },
  { id: "provider:giac", name: "GIAC" },
  { id: "provider:lpi-linux-professional-institute", name: "LPI - LINUX Professional Institute" },
  { id: "provider:the-linux-foundation", name: "The LINUX Foundation" },
  { id: "provider:red-hat", name: "Red Hat" },
  { id: "provider:oracle", name: "Oracle" },
  { id: "provider:isc2", name: "(ISC)2" },
  { id: "provider:amazon-web-services", name: "Amazon Web Services" },
];

const certificates: CertRecord[] = [
  { id: "cert:comptia:a-ce", providerId: "provider:comptia", name: "CompTIA A+ ce" },
  { id: "cert:comptia:data", providerId: "provider:comptia", name: "CompTIA Data+" },
  { id: "cert:comptia:linux", providerId: "provider:comptia", name: "CompTIA Linux+" },
  { id: "cert:comptia:network", providerId: "provider:comptia", name: "CompTIA Network+" },
  { id: "cert:comptia:security", providerId: "provider:comptia", name: "CompTIA Security+" },
  { id: "cert:comptia:security-x", providerId: "provider:comptia", name: "CompTIA Security X" },
  { id: "cert:comptia:pentest", providerId: "provider:comptia", name: "CompTIA PenTest+" },
  { id: "cert:comptia:cysa", providerId: "provider:comptia", name: "CompTIA CySA+" },
  { id: "cert:comptia:tech", providerId: "provider:comptia", name: "CompTIA Tech+" },
  {
    id: "cert:cisco:ccna",
    providerId: "provider:cisco",
    name: "CCNA (Cisco Certified Network Associate)",
  },
  {
    id: "cert:cisco:ccnp-security",
    providerId: "provider:cisco",
    name: "CCNP (Cisco Certified Network Professional) - Security",
  },
  {
    id: "cert:cisco:ccnp-enterprise",
    providerId: "provider:cisco",
    name: "CCNP (Cisco Certified Network Professional)- Enterprise",
  },
  {
    id: "cert:cisco:ccnp-collaboration",
    providerId: "provider:cisco",
    name: "CCNP (Cisco Certified Network Professional) - Collaboration",
  },
  {
    id: "cert:cisco:ccie-security",
    providerId: "provider:cisco",
    name: "CCIE (Cisco Certified Internetwork Expert)- Security",
  },
  {
    id: "cert:cisco:ccie-data-center",
    providerId: "provider:cisco",
    name: "CCIE (Cisco Certified Internetwork Expert)- Data Center",
  },
  {
    id: "cert:ec-council:ceh",
    providerId: "provider:ec-council",
    name: "CEH (Certified Ethical Hacker)",
  },
  {
    id: "cert:giac:gsec",
    providerId: "provider:giac",
    name: "GSEC (GIAC Security Essentials Certification)",
  },
  {
    id: "cert:giac:gced",
    providerId: "provider:giac",
    name: "GCED (GIAC Certified Enterprise Defender)",
  },
  {
    id: "cert:lpi-linux-professional-institute:linux-essentials",
    providerId: "provider:lpi-linux-professional-institute",
    name: "Linux Essentials",
  },
  {
    id: "cert:lpi-linux-professional-institute:linux-lpic-1",
    providerId: "provider:lpi-linux-professional-institute",
    name: "Linux LPIC - 1",
  },
  {
    id: "cert:lpi-linux-professional-institute:linux-lpic-3-security",
    providerId: "provider:lpi-linux-professional-institute",
    name: "Linux LPIC-3 Security",
  },
  {
    id: "cert:lpi-linux-professional-institute:linux-lpic-3-mixed-environments",
    providerId: "provider:lpi-linux-professional-institute",
    name: "Linux LPIC-3 Mixed Environments",
  },
  {
    id: "cert:the-linux-foundation:lfcs",
    providerId: "provider:the-linux-foundation",
    name: "Linux Foundation Certified Administrator (LFCS)",
  },
  {
    id: "cert:red-hat:rhcsa",
    providerId: "provider:red-hat",
    name: "Red Hat Certified Systems Administrator (RHCSA)",
  },
  {
    id: "cert:red-hat:rhce",
    providerId: "provider:red-hat",
    name: "Red Hat Certified Engineer (RHCE)",
  },
  {
    id: "cert:oracle:oracle-linux-8",
    providerId: "provider:oracle",
    name: "Oracle Linux 8 Advanced System Administration (1Z0-106)",
  },
  {
    id: "cert:isc2:ccsp",
    providerId: "provider:isc2",
    name: "CCSP (Certified Cloud Security Professional)",
  },
  {
    id: "cert:isc2:cc",
    providerId: "provider:isc2",
    name: "CC - Certified in Cybersecurity",
  },
  {
    id: "cert:aws:cloud-practitioner",
    providerId: "provider:amazon-web-services",
    name: "AWS Certified Cloud Practitioner (CLF)",
  },
  {
    id: "cert:aws:solutions-architect",
    providerId: "provider:amazon-web-services",
    name: "AWS Certified Solutions Architect - Associate",
  },
  {
    id: "cert:isc2:associate-ccsp",
    providerId: "provider:isc2",
    name: "Associate of (ISC)2 Designation CCSP",
  },
];

const resolver = createCertResolver(certificates, providers);

const resolve = (text: string, vendor?: string) =>
  resolver.resolve(vendor ? { text, vendor } : { text }).certificateIds;

describe("cert mention resolution", () => {
  it("does not let A+ swallow Data+", () => {
    expect(resolve("A+", "CompTIA")).toEqual(["cert:comptia:a-ce"]);
    expect(resolve("Data+", "CompTIA")).toEqual(["cert:comptia:data"]);
  });

  it("matches plus-suffixed products under a vendor", () => {
    expect(resolve("Network+", "CompTIA")).toEqual(["cert:comptia:network"]);
    expect(resolve("Linux+", "CompTIA")).toEqual(["cert:comptia:linux"]);
    expect(resolve("CySA+", "CompTIA")).toEqual(["cert:comptia:cysa"]);
  });

  it("matches a product whose catalog name spells the acronym out", () => {
    expect(resolve("LFCS", "Linux Foundation")).toEqual([
      "cert:the-linux-foundation:lfcs",
    ]);
    expect(resolve("Certified System Administrator (LFCS)", "Linux Foundation")).toEqual([
      "cert:the-linux-foundation:lfcs",
    ]);
    expect(resolve("RHCSA", "Red Hat")).toEqual(["cert:red-hat:rhcsa"]);
    expect(resolve("CEH", "ECC")).toEqual(["cert:ec-council:ceh"]);
  });

  it("normalizes inconsistently written LPIC levels", () => {
    expect(resolve("LPIC- 1", "LPI")).toEqual([
      "cert:lpi-linux-professional-institute:linux-lpic-1",
    ]);
    expect(resolve("LPIC – 3", "LPI").sort()).toEqual([
      "cert:lpi-linux-professional-institute:linux-lpic-3-mixed-environments",
      "cert:lpi-linux-professional-institute:linux-lpic-3-security",
    ]);
  });

  it("narrows a family match with a trailing qualifier", () => {
    expect(resolve("CCNP - Security", "Cisco")).toEqual([
      "cert:cisco:ccnp-security",
    ]);
  });

  it("honors an inline exception", () => {
    expect(resolve("CCIE (except collaboration)", "Cisco").sort()).toEqual([
      "cert:cisco:ccie-data-center",
      "cert:cisco:ccie-security",
    ]);
    expect(resolve("CCNP (except collaboration)", "Cisco").sort()).toEqual([
      "cert:cisco:ccnp-enterprise",
      "cert:cisco:ccnp-security",
    ]);
  });

  it("prefers a spelled-out name over an associate-level designation", () => {
    expect(resolve("Certified Cloud Security Professional (CCSP)")).toEqual([
      "cert:isc2:ccsp",
    ]);
  });

  it("matches a vendor exam code", () => {
    expect(resolve("Oracle Linux 8 Advanced System Administration (1Z0-106)")).toEqual([
      "cert:oracle:oracle-linux-8",
    ]);
  });

  it("reads a vendor label written with stray punctuation", () => {
    expect(resolve("CC", "ISC(2)")).toEqual(["cert:isc2:cc"]);
    expect(resolve("CC", "(ISC)2")).toEqual(["cert:isc2:cc"]);
  });

  it("matches a vendor's product when WGU shortens the name", () => {
    expect(resolve("Certified Practitioner", "AWS")).toEqual([
      "cert:aws:cloud-practitioner",
    ]);
  });

  it("does not use a shortened name across vendors", () => {
    expect(resolve("Certified Practitioner")).toEqual([]);
  });

  it("returns nothing for a retired product name", () => {
    expect(resolve("ITF+", "CompTIA")).toEqual([]);
  });
});

describe("parseCertMentions", () => {
  it("splits vendor-grouped lists", () => {
    const mentions = parseCertMentions(
      "CompTIA: Network+, Security+, Pentest+, CySA+, Security X (CASP+); ECC: - CEH; Cisco: CCNA, any CCNP, any CCIE (except collaboration). GIAC: GSE, GSEC, GCIA, GCED.",
    );
    expect(mentions.filter((m) => /comptia/i.test(m.vendor ?? "")).map((m) => m.text)).toEqual([
      "Network+",
      "Security+",
      "Pentest+",
      "CySA+",
      "Security X (CASP+)",
    ]);
    expect(mentions.find((m) => m.text === "CEH")?.vendor).toBe("ECC");
    expect(mentions.map((m) => m.text)).toContain("CCIE (except collaboration)");
    expect(mentions.filter((m) => m.vendor === "GIAC").map((m) => m.text)).toEqual([
      "GSE",
      "GSEC",
      "GCIA",
      "GCED",
    ]);
  });

  it("splits two certifications left without a separator", () => {
    const mentions = parseCertMentions(
      "GIAC Certified Forensic Analyst (GCFA) GIAC Certified Forensic Examiner (GCFE)",
    );
    expect(mentions.map((m) => `${m.vendor ?? "-"}/${m.text}`)).toEqual([
      "GIAC/Certified Forensic Analyst (GCFA)",
      "GIAC/Certified Forensic Examiner (GCFE)",
    ]);
  });

  it("keeps a trailing parenthetical attached to its certification", () => {
    expect(parseCertMentions("Security X (CASP+)").map((m) => m.text)).toEqual([
      "Security X (CASP+)",
    ]);
  });

  it("splits the Linux Foundations list from the ASCSIA guidelines", () => {
    const mentions = parseCertMentions(
      "CompTIA: Linux+; LPI: Linux Essentials, LPIC- 1, LPIC-2, or any LPIC – 3; Linux Foundation: Certified System Administrator (LFCS); Red Hat: RHCSA, RHCE or RHCA; or Oracle Linux 8 Advanced System Administration (1Z0-106).",
    );
    expect(mentions.filter((m) => m.vendor === "LPI").map((m) => m.text)).toEqual([
      "Linux Essentials",
      "LPIC- 1",
      "LPIC-2",
      "LPIC – 3",
    ]);
    expect(mentions.filter((m) => m.vendor === "Red Hat").map((m) => m.text)).toEqual([
      "RHCSA",
      "RHCE",
      "RHCA",
    ]);
  });
});
