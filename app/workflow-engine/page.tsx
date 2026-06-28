import {PageHeader} from "@/components/page-header";
import {WorkflowEngine} from "@/components/workflow-engine";
import {requireExecutiveSession} from "@/features/auth/session";
import {getWorkflowEngineData} from "@/server/repositories/workflow-engine";

export const dynamic = "force-dynamic";

export default async function WorkflowEnginePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    department?: string;
    country?: string;
    priority?: string;
    ai?: string;
    human?: string;
    date?: string;
    workflow?: string;
    notice?: string;
    error?: string;
  }>;
}) {
  await requireExecutiveSession();
  const params = await searchParams;
  const data = getWorkflowEngineData({
    q: params.q,
    status: params.status,
    department: params.department,
    country: params.country,
    priority: params.priority,
    ai: params.ai,
    human: params.human,
    date: params.date,
    workflowId: params.workflow,
  });
  return (
    <div className="page workflow-page">
      <PageHeader
        eyebrow="AUTOMATION CONTROL"
        title="Workflow Engine"
        subtitle="Design, run, monitor and audit Morifar workflows across human users and AI professionals."
      />
      <WorkflowEngine key={data.selectedWorkflow?.id ?? "empty"} data={data} notice={params.notice} error={params.error} />
    </div>
  );
}
