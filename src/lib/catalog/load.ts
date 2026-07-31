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
