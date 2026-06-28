import {PageHeader} from "@/components/page-header";
import {AiCommandCenter} from "@/components/ai-command-center";
import {requireExecutiveSession} from "@/features/auth/session";
import {getAiCommandCenterData} from "@/server/repositories/ai-command-center";

export const dynamic = "force-dynamic";

export default async function AiCommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<{notice?: string; error?: string}>;
}) {
  await requireExecutiveSession();
  const [data, query] = await Promise.all([getAiCommandCenterData(), searchParams]);
  return (
    <div className="page command-center-page">
      <PageHeader
        eyebrow="AI WORKFORCE CONTROL"
        title="AI Command Center"
        subtitle="Monitor, direct, and review Morifar's AI professionals from one operating view."
      />
      <AiCommandCenter data={data} notice={query.notice} error={query.error} />
    </div>
  );
}
