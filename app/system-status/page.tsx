import {IconAlertTriangle, IconCircleCheck, IconDatabase, IconGitBranch, IconShieldCheck} from "@tabler/icons-react";
import packageJson from "@/package.json";
import {PageHeader} from "@/components/page-header";
import {requireExecutiveSession} from "@/features/auth/session";

const requiredRoutes = [
  "/dashboard",
  "/service-automation",
  "/crm",
  "/leads",
  "/tasks",
  "/company-formation",
  "/documents",
  "/approvals",
  "/department-queues",
  "/ai-professionals",
  "/ai-command-center",
  "/workflow-engine",
  "/executive-copilot",
  "/client-intelligence",
  "/operations-intelligence",
  "/knowledge-base",
  "/settings",
  "/system-status",
];

function releaseValue(value: string | undefined, fallback = "Not provided") {
  return value && value.trim().length > 0 ? value : fallback;
}

export default async function SystemStatusPage() {
  const user = await requireExecutiveSession();
  const isVercel = process.env.VERCEL === "1";
  const commit = releaseValue(process.env.VERCEL_GIT_COMMIT_SHA, "Local build");
  const buildTime = releaseValue(process.env.NEXT_PUBLIC_BUILD_TIME ?? process.env.BUILD_TIME, "Runtime generated");
  const environment = releaseValue(process.env.VERCEL_ENV ?? process.env.NODE_ENV, "unknown");
  const databaseMode = isVercel ? "Ephemeral SQLite in serverless /tmp" : "Local SQLite data file";
  const authStatus = `${user.role} session active`;
  const knownRisks = [
    "SQLite uses Node's experimental node:sqlite API and should be migrated to durable managed storage before live client data.",
    "Browser console and network logs should be re-checked after every production deployment.",
    "Multi-role access needs continued regression testing as new departments are added.",
  ];

  return (
    <div className="page system-status-page">
      <PageHeader
        eyebrow="RELEASE OPERATIONS"
        title="System Status"
        subtitle="Internal deployment, route health and production readiness visibility for Morifar OS."
      />
      <section className="kpi-grid system-kpi-grid">
        <div className="kpi-card"><IconGitBranch size={18}/><small>APP VERSION</small><strong>{packageJson.version}</strong><p>Morifar OS package release</p></div>
        <div className="kpi-card"><IconCircleCheck size={18}/><small>CURRENT PHASE</small><strong>6</strong><p>Service automation platform</p></div>
        <div className="kpi-card"><IconShieldCheck size={18}/><small>LAST QA SCORE</small><strong>94</strong><p>Phase 6 local release QA</p></div>
        <div className="kpi-card"><IconDatabase size={18}/><small>DATABASE MODE</small><strong>{isVercel ? "Vercel" : "Local"}</strong><p>{databaseMode}</p></div>
      </section>
      <section className="section-grid system-grid">
        <article className="panel">
          <div className="panel-head"><div><h2>Deployment</h2><p>Build and runtime identity</p></div></div>
          <dl className="status-dl">
            <div><dt>Git commit</dt><dd>{commit.slice(0, 12)}</dd></div>
            <div><dt>Environment</dt><dd>{environment}</dd></div>
            <div><dt>Build time</dt><dd>{buildTime}</dd></div>
            <div><dt>Auth status</dt><dd>{authStatus}</dd></div>
          </dl>
        </article>
        <article className="panel">
          <div className="panel-head"><div><h2>Known Risks</h2><p>Tracked before Phase 6 build-out</p></div></div>
          <div className="risk-list">
            {knownRisks.map(risk => <div key={risk}><IconAlertTriangle size={15}/><p>{risk}</p></div>)}
          </div>
        </article>
      </section>
      <section className="panel">
        <div className="panel-head"><div><h2>Route Health</h2><p>Required protected routes from the Phase 5.1 smoke suite</p></div></div>
        <div className="route-health-grid">
          {requiredRoutes.map(route => <div key={route}><IconCircleCheck size={14}/><span>{route}</span><strong>Required</strong></div>)}
        </div>
      </section>
    </div>
  );
}
