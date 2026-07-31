export function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={compact ? "disclaimer disclaimer--compact" : "disclaimer"}>
      <p>
        Unofficial planning aid based on publicly listed WGU transfer information.
        This is not an official evaluation. Speak with a WGU enrollment counselor
        for a binding transfer review. Many IT certifications must be earned within
        the last five years.
      </p>
    </aside>
  );
}
