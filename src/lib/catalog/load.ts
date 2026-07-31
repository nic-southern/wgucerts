import catalogJson from "../../../data/catalog/catalog.json";
import { catalogSchema, type Catalog } from "./schema";

let cached: Catalog | null = null;

export function getCatalog(): Catalog {
  if (!cached) {
    cached = catalogSchema.parse(catalogJson);
  }
  return cached;
}

export function getProgramBySlug(slug: string) {
  return getCatalog().programs.find((p) => p.slug === slug);
}

export function getBachelorPrograms() {
  return getCatalog().programs.filter((p) => p.degreeLevel === "bachelors");
}

export function certificatesByProvider() {
  const catalog = getCatalog();
  return catalog.providers
    .map((provider) => ({
      provider,
      certificates: catalog.certificates.filter(
        (c) => c.providerId === provider.id,
      ),
    }))
    .filter((group) => group.certificates.length > 0)
    .sort((a, b) => a.provider.name.localeCompare(b.provider.name));
}

/** Alternate-credit courses (Sophia, Study.com) grouped by their provider. */
export function transferCoursesByProvider() {
  const catalog = getCatalog();
  const clearsSomething = new Set(
    catalog.transferCourseClears.map((c) => c.transferCourseId),
  );
  return catalog.transferProviders
    .map((provider) => ({
      provider,
      courses: catalog.transferCourses
        // A course we hold no mapping for would tick but clear nothing.
        .filter((c) => c.providerId === provider.id && clearsSomething.has(c.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((group) => group.courses.length > 0)
    .sort((a, b) => a.provider.name.localeCompare(b.provider.name));
}
