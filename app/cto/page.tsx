import {PageHeader} from "@/components/page-header";
import {CtoModeConsole} from "@/components/cto-mode-console";
import {requireCtoOwnerSession} from "@/features/auth/session";
import {getCtoModeData} from "@/server/repositories/cto-mode";

export const dynamic = "force-dynamic";

export default async function CtoModePage() {
  await requireCtoOwnerSession();
  const data = getCtoModeData();
  return (
    <div className="page cto-mode-page">
      <PageHeader
        eyebrow="ENTERPRISE ENGINEERING CONSOLE"
        title="CTO Mode"
        subtitle="Internal engineering console for architecture, routes, features, database, services, AI, QA, documentation, health and release visibility."
      />
      <CtoModeConsole data={data} />
    </div>
  );
}

