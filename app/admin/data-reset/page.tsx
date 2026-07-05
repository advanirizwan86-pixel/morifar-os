import {PageHeader} from "@/components/page-header";
import {DataResetPanel} from "@/components/data-reset-panel";
import {requireSuperAdminSession} from "@/features/auth/session";
import {getDataResetPreview} from "@/server/repositories/data-reset";

export const dynamic = "force-dynamic";

export default async function DataResetPage() {
  await requireSuperAdminSession();
  const preview = getDataResetPreview();
  return (
    <div className="page">
      <PageHeader eyebrow="ADMIN RESET" title="Data Reset" subtitle="Export and clear demo operational data before real Morifar operations begin." />
      <DataResetPanel preview={preview} />
    </div>
  );
}

