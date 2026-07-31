import type {
  Catalog,
  Certificate,
  Provider,
  TransferCourse,
  TransferProvider,
} from "./schema";

export type CertClearOption = {
  kind: "certificate";
  certificate: Certificate;
  provider: Provider;
  source: string;
  confidence: "published" | "estimated";
};

export type TransferClearOption = {
  kind: "transfer";
  transferCourse: TransferCourse;
  provider: TransferProvider;
  source: string;
  confidence: "published" | "estimated";
};

export type CourseClearOptions = {
  courseId: string;
  certificates: CertClearOption[];
  transferCourses: TransferClearOption[];
  /** WGU accepts no transfer credit for this course in this program. */
  nonTransferable: boolean;
};

/**
 * Reverse lookup: what can clear a given WGU course. Scoped to a program
 * because WGU accepts a certificate for a course in some programs and not
 * others, and marks the same course non-transferable in others again.
 */
export function getClearsForCourse(
  catalog: Catalog,
  courseId: string,
  programId: string,
): CourseClearOptions {
  const certById = new Map(catalog.certificates.map((c) => [c.id, c]));
  const providerById = new Map(catalog.providers.map((p) => [p.id, p]));
  const transferById = new Map(catalog.transferCourses.map((c) => [c.id, c]));
  const transferProviderById = new Map(
    catalog.transferProviders.map((p) => [p.id, p]),
  );

  const certificates: CertClearOption[] = [];
  for (const clear of catalog.certCourseClears) {
    if (clear.courseId !== courseId) continue;
    // An empty program list means the rule is not program-specific.
    if (clear.programIds.length > 0 && !clear.programIds.includes(programId)) {
      continue;
    }
    const certificate = certById.get(clear.certificateId);
    const provider = certificate
      ? providerById.get(certificate.providerId)
      : undefined;
    if (!certificate || !provider) continue;
    certificates.push({
      kind: "certificate",
      certificate,
      provider,
      source: clear.source,
      confidence: clear.confidence,
    });
  }

  const transferCourses: TransferClearOption[] = [];
  for (const clear of catalog.transferCourseClears) {
    if (clear.courseId !== courseId) continue;
    const transferCourse = transferById.get(clear.transferCourseId);
    const provider = transferCourse
      ? transferProviderById.get(transferCourse.providerId)
      : undefined;
    if (!transferCourse || !provider) continue;
    transferCourses.push({
      kind: "transfer",
      transferCourse,
      provider,
      source: clear.source,
      confidence: clear.confidence,
    });
  }

  certificates.sort((a, b) =>
    `${a.provider.name} ${a.certificate.name}`.localeCompare(
      `${b.provider.name} ${b.certificate.name}`,
    ),
  );
  transferCourses.sort((a, b) =>
    `${a.provider.name} ${a.transferCourse.name}`.localeCompare(
      `${b.provider.name} ${b.transferCourse.name}`,
    ),
  );

  const nonTransferable = catalog.nonTransferableCourses.some(
    (entry) =>
      entry.courseId === courseId && entry.programIds.includes(programId),
  );

  return { courseId, certificates, transferCourses, nonTransferable };
}

export function hasClearOptions(options: CourseClearOptions): boolean {
  return options.certificates.length > 0 || options.transferCourses.length > 0;
}
