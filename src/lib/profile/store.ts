"use client";

import {
  defaultProfile,
  PROFILE_STORAGE_KEY,
  userProfileSchema,
  type UserProfile,
} from "./schema";

export function readProfile(): UserProfile {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return defaultProfile;
    return userProfileSchema.parse(JSON.parse(raw));
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
  writeProfile(defaultProfile);
}
