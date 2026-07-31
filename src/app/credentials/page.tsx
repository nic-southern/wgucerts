import { CredentialsForm } from "@/components/credentials-form";
import { certificatesByProvider } from "@/lib/catalog/load";

export default function CredentialsPage() {
  const groups = certificatesByProvider();

  return (
    <>
      <h1 className="page-title">Credentials</h1>
      <p className="lede">
        Add a prior degree and the certificates you hold. Everything stays in
        this browser — nothing is uploaded.
      </p>
      <CredentialsForm groups={groups} />
    </>
  );
}
