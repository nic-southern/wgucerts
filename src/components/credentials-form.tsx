"use client";

import { useMemo, useState } from "react";
import type { Certificate, Provider } from "@/lib/catalog/schema";
import { useProfile } from "@/lib/profile/use-profile";

type Group = {
  provider: Provider;
  certificates: Certificate[];
};

const DEGREE_OPTIONS = [
  { value: "none", label: "No prior degree" },
  { value: "associates", label: "Associate degree" },
  { value: "associates_it", label: "Associate degree in IT" },
  { value: "bachelors", label: "Bachelor’s degree" },
] as const;

export function CredentialsForm({ groups }: { groups: Group[] }) {
  const {
    profile,
    hydrated,
    setPriorDegree,
    toggleCertificate,
    clear,
  } = useProfile();
  const [query, setQuery] = useState("");
  const [openProviderId, setOpenProviderId] = useState<string | null>(
    groups[0]?.provider.id ?? null,
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        provider: group.provider,
        certificates: group.certificates.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            group.provider.name.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.certificates.length > 0);
  }, [groups, query]);

  const selectedCount = profile.certificateIds.length;

  return (
    <div className="credentials">
      <section className="panel">
        <h2>Prior degree</h2>
        <p className="muted">
          An associate or bachelor’s degree often clears general education.
          An IT associate may also clear foundations courses.
        </p>
        <div className="choice-grid" role="radiogroup" aria-label="Prior degree">
          {DEGREE_OPTIONS.map((option) => (
            <label key={option.value} className="choice">
              <input
                type="radio"
                name="priorDegree"
                disabled={!hydrated}
                checked={profile.priorDegree === option.value}
                onChange={() => setPriorDegree(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Certificates</h2>
            <p className="muted">
              Choose by provider, then certificate. Saved only in this browser.
              {hydrated ? ` ${selectedCount} selected.` : ""}
            </p>
          </div>
          <button type="button" className="button button--ghost" onClick={clear}>
            Clear all
          </button>
        </div>

        <label className="field">
          <span className="field__label">Search</span>
          <input
            className="field__control"
            type="search"
            placeholder="Search providers or certificates"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="provider-list">
          {filtered.length === 0 ? (
            <p className="empty">No certificates match that search.</p>
          ) : (
            filtered.map((group) => {
              const open = openProviderId === group.provider.id;
              const selectedInGroup = group.certificates.filter((c) =>
                profile.certificateIds.includes(c.id),
              ).length;
              return (
                <div key={group.provider.id} className="provider-block">
                  <button
                    type="button"
                    className="provider-block__toggle"
                    aria-expanded={open}
                    onClick={() =>
                      setOpenProviderId(open ? null : group.provider.id)
                    }
                  >
                    <span>{group.provider.name}</span>
                    <span className="muted">
                      {selectedInGroup > 0
                        ? `${selectedInGroup} selected · `
                        : ""}
                      {group.certificates.length}
                    </span>
                  </button>
                  {open ? (
                    <ul className="cert-list">
                      {group.certificates.map((cert) => {
                        const checked = profile.certificateIds.includes(cert.id);
                        return (
                          <li key={cert.id}>
                            <label className="cert-row">
                              <input
                                type="checkbox"
                                disabled={!hydrated}
                                checked={checked}
                                onChange={() => toggleCertificate(cert.id)}
                              />
                              <span>{cert.name}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
