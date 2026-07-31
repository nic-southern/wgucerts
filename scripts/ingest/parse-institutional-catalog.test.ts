import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseInstitutionalCatalogText } from "./parse-institutional-catalog";

describe("parseInstitutionalCatalogText", () => {
  it("extracts cyber course tables with CUs from fixture text", () => {
    const padded = `
Bachelor of Science, Cybersecurity and Information Assurance
CCN Course Number Course Description CUs Term
ITEC 2002 D322 Introduction to IT 4 1
ENGL 1712 D270 Composition: Successful Self-Expression 3 1
ITEC 2112 D315 Network and Security - Foundations 3 2
COMM 1011 D268 Introduction to Communication: Connecting with Others 3 2
PHIL 1020 D265 Critical Thinking: Reason and Evidence 3 2
HUMN 1101 D333 Ethics in Technology 3 2
MATH 1200 C957 Applied Algebra 3 3
MATH 1101 C955 Applied Probability and Statistics 3 3
SCIE 1001 C683 Natural Science Lab 2 3
HLTH 1010 C458 Health, Fitness, and Wellness 4 3
ITEC 2013 D316 IT Foundations 4 4
ITEC 2023 D317 IT Applications 4 4
ITEC 3602 D325 Networks 4 4
ITEC 2113 D329 Network and Security - Applications 4 5
ITAS 3030 D827 Fundamentals of Information Security 3 5
ITAS 3031 D340 Cyber Defense and Countermeasures 4 9
BSCSIA 202509 Total CUs: 122
`;
    const parsed = parseInstitutionalCatalogText(padded);
    const cyber = parsed.find((p) => p.programCode === "BSCSIA");
    expect(cyber?.courses.length).toBeGreaterThanOrEqual(15);
    expect(cyber?.totalCus).toBe(122);
    expect(cyber?.courses.some((c) => c.code === "D322" && c.cu === 4)).toBe(
      true,
    );
  });

  it("keeps course names containing a sharp sign or a wide dash", () => {
    const text = `
Bachelor of Science, Software Engineering
CCN Course Number Course Description CUs Term
ITSW 2113 D278 Scripting and Programming - Foundations 3 1
ITSW 3151 D280 JavaScript Programming 3 2
ITSW 3215 C968 Software I – C# 6 3
ITSW 3225 C969 Software II – Advanced C# 6 4
ITSW 3315 C971 Mobile Application Development Using C# 3 5
ITEC 2002 D322 Introduction to IT 4 5
ENGL 1712 D270 Composition: Successful Self-Expression 3 6
ITEC 2112 D315 Network and Security - Foundations 3 6
MATH 1200 C957 Applied Algebra 3 7
MATH 1101 C955 Applied Probability and Statistics 3 7
SCIE 1001 C683 Natural Science Lab 2 8
HLTH 1010 C458 Health, Fitness, and Wellness 4 8
ITEC 2013 D316 IT Foundations 4 9
ITEC 2023 D317 IT Applications 4 9
ITAS 2110 D281 Linux Foundations 3 10
BSSWE 202509 Total CUs: 50
`;
    const [table] = parseInstitutionalCatalogText(text);
    const byCode = new Map(table.courses.map((c) => [c.code, c]));
    expect(byCode.get("C968")?.name).toBe("Software I – C#");
    expect(byCode.get("C969")?.cu).toBe(6);
    expect(byCode.get("C971")?.name).toBe(
      "Mobile Application Development Using C#",
    );
  });

  it("does not let Information Technology claim the IT Management table", () => {
    // Both headings exist in the catalog, and IT Management belongs to another
    // school. A prefix match used to hand its Business courses to BSIT.
    const table = (rows: string) => `CCN Course Number Course Description CUs Term
${rows}`;
    const text = `
Bachelor of Science, Information Technology Management
${table(`BUS 2010 C715 Organizational Behavior 3 1
BUS 2020 C721 Change Management 3 1
BUS 2030 D072 Fundamentals for Success in Business 3 1
BUS 2040 D075 Information Technology Management Essentials 3 2
BUS 2050 C723 Quantitative Analysis 3 2
BUS 2060 C724 Business Research 3 2
BUS 2070 D077 Concepts in Marketing 3 3
BUS 2080 D078 Business Environment Applications 3 3
BUS 2090 D079 Business Environment II 3 3
BUS 2100 D080 Managing in a Global Business 3 4
BUS 2110 D081 Innovative Leadership 3 4
BUS 2120 D082 Emotional and Cultural Intelligence 3 4
BUS 2130 D089 Principles of Economics 3 5
BUS 2140 D100 Introduction to Physical and Human Geography 3 5
BUS 2150 D196 Principles of Financial and Managerial Accounting 3 5
BSITM 202509 Total CUs: 45`)}

Bachelor of Science, Information Technology
${table(`ITEC 2002 D322 Introduction to IT 4 1
ENGL 1712 D270 Composition: Successful Self-Expression 3 1
ITEC 2112 D315 Network and Security - Foundations 3 2
ITSW 2113 D278 Scripting and Programming - Foundations 3 2
ITEC 2013 D316 IT Foundations 4 3
ITEC 2023 D317 IT Applications 4 3
ITAS 2110 D281 Linux Foundations 3 4
ITEC 3602 D325 Networks 4 4
MATH 1200 C957 Applied Algebra 3 5
MATH 1101 C955 Applied Probability and Statistics 3 5
SCIE 1001 C683 Natural Science Lab 2 6
HLTH 1010 C458 Health, Fitness, and Wellness 4 6
ITEC 2116 D426 Data Management - Foundations 3 7
ITEC 2117 D427 Data Management - Applications 4 7
ITEC 3010 D336 Business of IT - Applications 4 8
BSIT 202509 Total CUs: 50`)}
`;
    const parsed = parseInstitutionalCatalogText(text);
    const bsit = parsed.find((p) => p.programCode === "BSIT");
    expect(bsit?.courses.some((c) => c.code === "D315")).toBe(true);
    expect(bsit?.courses.some((c) => c.code === "C715")).toBe(false);
    expect(bsit?.totalCus).toBe(50);
  });

  it("parses live-fetched catalog snapshot when present", () => {
    const snapshot = path.resolve(
      process.cwd(),
      "data/catalog/institutional-catalog.txt",
    );
    let text: string;
    try {
      text = readFileSync(snapshot, "utf8");
    } catch {
      // Optional offline fixture; skip if ingest has not cached it yet
      return;
    }
    const parsed = parseInstitutionalCatalogText(text);
    expect(parsed.length).toBeGreaterThanOrEqual(5);
    const cyber = parsed.find((p) => p.programCode === "BSCSIA");
    expect((cyber?.courses.length ?? 0)).toBeGreaterThanOrEqual(30);
  });
});
