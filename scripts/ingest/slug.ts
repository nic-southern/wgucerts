export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function providerIdFromName(name: string): string {
  return `provider:${slugify(name)}`;
}

export function certificateIdFrom(providerId: string, name: string): string {
  const providerSlug = providerId.replace(/^provider:/, "");
  return `cert:${providerSlug}:${slugify(name)}`;
}

export function programIdFromName(name: string): string {
  return `program:${slugify(name)}`;
}
