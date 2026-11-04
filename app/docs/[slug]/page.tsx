import {requireSession as enforcePageAccess} from "@/features/auth/session";
import {readFile} from "node:fs/promises";
import {join, normalize} from "node:path";
import Link from "next/link";
import {IconArrowLeft} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {requireCtoSession} from "@/features/auth/session";

const allowedDocs = new Set([
  "MASTER_DOCUMENTATION.md",
  "PROJECT_OVERVIEW.md",
  "ARCHITECTURE.md",
  "PAGES.md",
  "FEATURES.md",
  "SERVICES.md",
  "DATABASE.md",
  "AI_SYSTEM.md",
  "WORKFLOW_ENGINE.md",
  "SECURITY.md",
  "API.md",
  "USER_GUIDE.md",
  "OPERATIONAL_PLAYBOOK.md",
  "KNOWN_LIMITATIONS.md",
  "TECHNICAL_DEBT.md",
  "PROJECT_TREE.md",
  "RELEASE_STATUS.md",
  "FRESH_START_GUIDE.md",
  "DAILY_OPERATING_PLAYBOOK.md",
]);

function renderMarkdown(markdown: string) {
  return markdown.split("\n").map((line, index) => {
    if (line.startsWith("# ")) return <h1 key={index}>{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={index}>{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={index}>{line.slice(4)}</h3>;
    if (line.startsWith("- ")) return <li key={index}>{line.slice(2)}</li>;
    if (/^\d+\. /.test(line)) return <li key={index}>{line.replace(/^\d+\. /, "")}</li>;
    if (!line.trim()) return <br key={index} />;
    return <p key={index}>{line}</p>;
  });
}

export default async function DocsPage({params}: {params: Promise<{slug: string}>}) {
 await enforcePageAccess();

  await requireCtoSession();
  const {slug} = await params;
  const file = decodeURIComponent(slug);
  if (!allowedDocs.has(file)) {
    return (
      <div className="page">
        <PageHeader eyebrow="DOCUMENTATION" title="Document not found" subtitle="The requested CTO document is not in the approved documentation pack." />
      </div>
    );
  }
  const docsRoot = join(process.cwd(), "docs");
  const filePath = normalize(join(docsRoot, file));
  const markdown = await readFile(filePath, "utf8");
  return (
    <div className="page docs-page">
      <Link className="back-link" href="/cto-start"><IconArrowLeft size={14} /> Back to CTO Start</Link>
      <article className="panel docs-reader">{renderMarkdown(markdown)}</article>
    </div>
  );
}

