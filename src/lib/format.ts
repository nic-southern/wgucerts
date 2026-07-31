/** Format competency units for display (WGU CUs ≈ semester credit hours). */
export function formatCus(cu: number | undefined | null): string {
  if (cu == null || Number.isNaN(cu)) return "—";
  return `${cu} CU${cu === 1 ? "" : "s"}`;
}
