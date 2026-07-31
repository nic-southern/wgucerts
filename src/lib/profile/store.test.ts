import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LEGACY_PROFILE_STORAGE_KEY,
  migrateLegacyProfile,
  PROFILE_STORAGE_KEY,
} from "./schema";
import { clearProfile, readProfile, toggleId, updateProfile } from "./store";

function stubBrowserStorage() {
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
      removeItem: (key: string) => void values.delete(key),
    },
    dispatchEvent: () => true,
  });
  return values;
}

describe("migrateLegacyProfile", () => {
  it("carries certificates and prior degree forward", () => {
    expect(
      migrateLegacyProfile({
        selectedProgramId: "program:bs-it",
        priorDegree: "associates_it",
        certificateIds: ["cert:comptia:network-plus"],
      }),
    ).toEqual({
      selectedProgramId: "program:bs-it",
      priorDegree: "associates_it",
      certificateIds: ["cert:comptia:network-plus"],
      completedCourseIds: [],
      completedTransferCourseIds: [],
    });
  });

  it("refuses anything that is not a stored profile", () => {
    expect(migrateLegacyProfile({ nonsense: true })).toBeNull();
    expect(migrateLegacyProfile(null)).toBeNull();
    expect(migrateLegacyProfile("")).toBeNull();
  });
});

describe("readProfile", () => {
  let values: Map<string, string>;

  beforeEach(() => {
    values = stubBrowserStorage();
  });

  it("starts empty when nothing is stored", () => {
    expect(readProfile()).toEqual({
      selectedProgramId: null,
      priorDegree: "none",
      certificateIds: [],
      completedCourseIds: [],
      completedTransferCourseIds: [],
    });
  });

  it("upgrades a profile saved before completion tracking existed", () => {
    values.set(
      LEGACY_PROFILE_STORAGE_KEY,
      JSON.stringify({
        selectedProgramId: "program:bs-it",
        priorDegree: "bachelors",
        certificateIds: ["cert:comptia:security-plus"],
      }),
    );

    const profile = readProfile();
    expect(profile.certificateIds).toEqual(["cert:comptia:security-plus"]);
    expect(profile.priorDegree).toBe("bachelors");
    expect(profile.completedCourseIds).toEqual([]);
  });

  it("prefers the current profile over an older leftover one", () => {
    values.set(
      LEGACY_PROFILE_STORAGE_KEY,
      JSON.stringify({
        selectedProgramId: "program:bs-it",
        priorDegree: "associates",
        certificateIds: ["cert:old"],
      }),
    );
    values.set(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        selectedProgramId: "program:bs-cs",
        priorDegree: "none",
        certificateIds: ["cert:new"],
        completedCourseIds: ["course:d322"],
        completedTransferCourseIds: [],
      }),
    );

    const profile = readProfile();
    expect(profile.certificateIds).toEqual(["cert:new"]);
    expect(profile.completedCourseIds).toEqual(["course:d322"]);
  });

  it("falls back to an empty profile rather than throwing on damaged storage", () => {
    values.set(PROFILE_STORAGE_KEY, "{not json");
    expect(readProfile().certificateIds).toEqual([]);
  });

  it("fills in lists missing from a stored profile", () => {
    values.set(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        selectedProgramId: null,
        priorDegree: "none",
        certificateIds: [],
      }),
    );
    expect(readProfile().completedTransferCourseIds).toEqual([]);
  });
});

describe("updateProfile", () => {
  beforeEach(stubBrowserStorage);

  it("persists a change and reads it back", () => {
    updateProfile((p) => ({ ...p, completedCourseIds: ["course:d322"] }));
    expect(readProfile().completedCourseIds).toEqual(["course:d322"]);
  });

  it("clears the older profile too, so nothing comes back", () => {
    updateProfile((p) => ({ ...p, certificateIds: ["cert:a"] }));
    clearProfile();
    expect(readProfile().certificateIds).toEqual([]);
  });
});

describe("toggleId", () => {
  it("adds when absent and removes when present", () => {
    expect(toggleId([], "a")).toEqual(["a"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleId(["a"], "b")).toEqual(["a", "b"]);
  });
});
