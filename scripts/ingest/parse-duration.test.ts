import { describe, expect, it } from "vitest";
import {
  courseCodesInText,
  describesCompletion,
  parseDurationDays,
} from "./parse-duration";

describe("parseDurationDays", () => {
  it("reads plain day counts", () => {
    expect(parseDurationDays("D335 passed in 8 days no coding experience")?.days).toBe(8);
    expect(parseDurationDays("C952 computer architecture passed in 10 days")?.days).toBe(10);
    // No preposition at all still carries a defensible number.
    expect(parseDurationDays("D385 software security and testing passed 10 days")?.days).toBe(10);
  });

  it("counts anything inside a single day as one day", () => {
    expect(parseDurationDays("passed D280 javascript programming in 3 hours")?.days).toBe(1);
    expect(parseDurationDays("I passed C683 in a day super easy class")?.days).toBe(1);
    expect(parseDurationDays("D417 network automation passed in just over 24 hours")?.days).toBe(1);
    expect(parseDurationDays("passed in one sitting")?.days).toBe(1);
    expect(parseDurationDays("finished D198 same day")?.days).toBe(1);
  });

  it("converts weeks and months", () => {
    expect(parseDurationDays("finished E026 AI for IT automation in 2 weeks")?.days).toBe(14);
    expect(parseDurationDays("D413 passed in 2 weeks")?.days).toBe(14);
    expect(parseDurationDays("passed D419 CCNA in one month")?.days).toBe(30);
    expect(parseDurationDays("D416 DevNet done in 3 months")?.days).toBe(90);
  });

  it("treats a weekend as two days", () => {
    expect(parseDurationDays("knocked out D197 in a weekend")?.days).toBe(2);
    expect(parseDurationDays("D372 over one weekend")?.days).toBe(2);
  });

  it("reports the phrase it read so a human can spot check", () => {
    expect(parseDurationDays("7 days to pass C955 stats and probability")).toEqual({
      days: 7,
      phrase: "7 days",
    });
  });

  it("returns null rather than guessing", () => {
    expect(parseDurationDays("passed C958 my tips")).toBeNull();
    expect(parseDurationDays("I passed D288 backend programming tips")).toBeNull();
    expect(parseDurationDays("D480 passed quickly here is how")).toBeNull();
    expect(parseDurationDays("passed D419 CCNA certification")).toBeNull();
    expect(parseDurationDays("D686 operating systems for computer scientist OA")).toBeNull();
    // Truncated URL slugs leave a bare number with no unit.
    expect(parseDurationDays("D326 advanced data management passed in 2")).toBeNull();
    expect(parseDurationDays("how I passed D324 comptia project in less than a")).toBeNull();
  });

  it("ignores numbers that are not elapsed time", () => {
    // Course numbering, task numbering, and years must not read as durations.
    expect(parseDurationDays("C959 discrete math 1 finished")).toBeNull();
    expect(parseDurationDays("WGU D682 guide task 1 AI optimization")).toBeNull();
    expect(parseDurationDays("new 2025 CS program completion more in comments")).toBeNull();
    // Effort is not elapsed time.
    expect(parseDurationDays("passed with 20 study hours")).toBeNull();
    expect(parseDurationDays("worth 3 credit hours")).toBeNull();
  });

  it("ignores time the poster still has ahead of them", () => {
    // Real title that read as 56 days for Natural Science Lab.
    expect(
      parseDurationDays("Finishing up my first term (8 weeks left) taking C175 this week"),
    ).toBeNull();
    expect(parseDurationDays("D335 with 3 weeks to go")).toBeNull();
    expect(parseDurationDays("2 months remaining in the term")).toBeNull();
  });

  it("rejects claims too long to describe one course", () => {
    expect(parseDurationDays("finished the whole degree in 2 years")).toBeNull();
    expect(parseDurationDays("done in 18 months")).toBeNull();
  });
});

describe("describesCompletion", () => {
  it("accepts titles that claim a pass", () => {
    // Real titles from a search for D335.
    expect(describesCompletion("Passed D335")).toBe(true);
    expect(
      describesCompletion(
        "I passed D335 - Introduction to Programming in Python in 18 days. Here's how I did it.",
      ),
    ).toBe(true);
    expect(describesCompletion("C959 discrete math 1 finished in 20 days")).toBe(true);
    expect(describesCompletion("Knocked out D197 in a weekend")).toBe(true);
    expect(describesCompletion("D286 took me 30 days")).toBe(true);
  });

  it("rejects titles that are asking for help, not reporting a pass", () => {
    expect(
      describesCompletion("Struggling with D335 (Intro to Python) - Multiple attempts"),
    ).toBe(false);
    expect(describesCompletion("A mindset shift that may help if D335 feels impossible")).toBe(
      false,
    );
    expect(describesCompletion("How to simplify the DREADED D335 Intro to Python")).toBe(false);
    expect(describesCompletion("D828 Legal Issues in Information Security")).toBe(false);
  });

  it("rejects a duration spent not clearing the course", () => {
    expect(describesCompletion("Failed D335 after 3 weeks")).toBe(false);
    expect(describesCompletion("Dropped the class after 2 weeks")).toBe(false);
    expect(describesCompletion("Didn't pass D335 in 4 weeks")).toBe(false);
    // Conservative: both signals present, so the number is not trustworthy.
    expect(describesCompletion("Failed twice then passed in 20 days")).toBe(false);
  });
});

describe("courseCodesInText", () => {
  it("pulls course codes out of a post slug", () => {
    expect(courseCodesInText("i_passed_c683_in_a_day_super_easy_class")).toEqual(["C683"]);
    expect(courseCodesInText("d496_d497_d498_udacity_nanodegree")).toEqual([
      "D496",
      "D497",
      "D498",
    ]);
  });

  it("does not mistake longer numbers for course codes", () => {
    expect(courseCodesInText("passed in 2025 with e0999 something")).toEqual([]);
  });
});
