import { PlanView } from "@/components/plan-view";
import { getCatalog } from "@/lib/catalog/load";

export default function PlanPage() {
  const catalog = getCatalog();

  return (
    <>
      <h1 className="page-title">My plan</h1>
      <p className="lede">
        Cleared versus remaining courses for your selected program, based on the
        credentials saved in this browser.
      </p>
      <PlanView catalog={catalog} />
    </>
  );
}
