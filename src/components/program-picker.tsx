"use client";

import { useProfile } from "@/lib/profile/use-profile";

type ProgramOption = {
  id: string;
  name: string;
  slug: string;
};

export function ProgramPicker({ programs }: { programs: ProgramOption[] }) {
  const { profile, setSelectedProgramId, hydrated } = useProfile();

  return (
    <label className="field">
      <span className="field__label">Your program</span>
      <select
        className="field__control"
        disabled={!hydrated}
        value={profile.selectedProgramId ?? ""}
        onChange={(e) =>
          setSelectedProgramId(e.target.value ? e.target.value : null)
        }
      >
        <option value="">Select a program</option>
        {programs.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name}
          </option>
        ))}
      </select>
    </label>
  );
}
