import {PageHeader} from "@/components/page-header";
import {AiDisclosure, IntelligenceLinkBar, OperationsDashboard} from "@/components/intelligence-panels";
import {getOperationsIntelligence} from "@/server/services/intelligence";

export const dynamic = "force-dynamic";

export default function OperationsIntelligencePage() {
  const data = getOperationsIntelligence();
  return (
    <div className="page">
      <PageHeader eyebrow="OPERATIONS INTELLIGENCE" title="Intelligence Dashboard" subtitle="Executive workload, bottleneck, delay, health and productivity signals." />
      <IntelligenceLinkBar />
      <AiDisclosure />
      <OperationsDashboard data={data} />
    </div>
  );
}
