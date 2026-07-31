"use client";

import {
  defaultProfile,
  LEGACY_PROFILE_STORAGE_KEY,
  migrateLegacyProfile,
  PROFILE_STORAGE_KEY,
  userProfileSchema,
  type UserProfile,
} from "./schema";

export function readProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) return userProfileSchema.parse(JSON.parse(raw));

    const legacy = window.localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY);
    if (legacy) {
      const migrated = migrateLegacyProfile(JSON.parse(legacy));
      if (migrated) return migrated;
    }
    return defaultProfile;
  } catch {
    return defaultProfile;
  }
}

export function writeProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  const parsed = userProfileSchema.parse(profile);
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(parsed));
  window.dispatchEvent(new Event("wgucerts-profile"));
}

export function updateProfile(
  updater: (current: UserProfile) => UserProfile,
): UserProfile {
  const next = updater(readProfile());
  writeProfile(next);
  return next;
}

export function clearProfile(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LEGACY_PROFILE_STORAGE_KEY);
  }
  writeProfile(defaultProfile);
}

/** Adds or removes `id`, leaving the rest of the list untouched. */
export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}
