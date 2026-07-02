import {PageHeader} from "@/components/page-header";
import {AiDisclosure, IntelligenceLinkBar, KnowledgeGrid} from "@/components/intelligence-panels";
import {getKnowledgeArticles} from "@/server/services/intelligence";

export const dynamic = "force-dynamic";

export default function KnowledgeBasePage() {
  return (
    <div className="page">
      <PageHeader eyebrow="KNOWLEDGE BASE" title="Morifar Knowledge Repository" subtitle="SOPs, guides, policies, procedures and templates prepared for future retrieval." />
      <IntelligenceLinkBar />
      <AiDisclosure />
      <KnowledgeGrid articles={getKnowledgeArticles()} />
    </div>
  );
}
