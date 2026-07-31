"use client";

import { useSyncExternalStore } from "react";
import { defaultProfile, type UserProfile } from "./schema";
import { clearProfile, readProfile, toggleId, updateProfile } from "./store";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("wgucerts-profile", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("wgucerts-profile", onStoreChange);
  };
}

function getSnapshot(): string {
  return JSON.stringify(readProfile());
}

function getServerSnapshot(): string {
  return JSON.stringify(defaultProfile);
}

function subscribeHydration() {
  return () => {};
}

export function useProfile() {
  const json = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const profile = JSON.parse(json) as UserProfile;
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );

  return {
    profile,
    hydrated,
    setSelectedProgramId(programId: string | null) {
      updateProfile((p) => ({ ...p, selectedProgramId: programId }));
    },
    setPriorDegree(priorDegree: UserProfile["priorDegree"]) {
      updateProfile((p) => ({ ...p, priorDegree }));
    },
    toggleCertificate(certificateId: string) {
      updateProfile((p) => ({
        ...p,
        certificateIds: toggleId(p.certificateIds, certificateId),
      }));
    },
    toggleCompletedCourse(courseId: string) {
      updateProfile((p) => ({
        ...p,
        completedCourseIds: toggleId(p.completedCourseIds, courseId),
      }));
    },
    toggleCompletedTransferCourse(transferCourseId: string) {
      updateProfile((p) => ({
        ...p,
        completedTransferCourseIds: toggleId(
          p.completedTransferCourseIds,
          transferCourseId,
        ),
      }));
    },
    clear() {
      clearProfile();
    },
  };
}
