import { CredentialsForm } from "@/components/credentials-form";
import {
  certificatesByProvider,
  transferCoursesByProvider,
} from "@/lib/catalog/load";

export default function CredentialsPage() {
  const groups = certificatesByProvider();
  const transferGroups = transferCoursesByProvider();

  return (
    <>
      <h1 className="page-title">Credentials</h1>
      <p className="lede">
        Add a prior degree, the certificates you hold, and any courses you have
        already finished. Everything stays in this browser — nothing is uploaded.
      </p>
      <CredentialsForm groups={groups} transferGroups={transferGroups} />
    </>
  );
}
