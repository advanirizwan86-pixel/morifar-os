import Link from "next/link";
import {IconBrain, IconSearch} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {AiDisclosure, IntelligenceLinkBar} from "@/components/intelligence-panels";
import {answerExecutiveQuestion} from "@/server/services/intelligence";

export const dynamic = "force-dynamic";

const prompts = [
  "Which clients require urgent attention?",
  "Which company formations are delayed?",
  "Which consultant has the highest workload?",
  "Which department has the largest backlog?",
  "Which approvals are pending?",
  "Show today's highest-priority work.",
];

export default async function ExecutiveCopilotPage({searchParams}: {searchParams: Promise<{q?: string}>}) {
  const {q = "Show today's highest-priority work."} = await searchParams;
  const response = await answerExecutiveQuestion(q);
  return (
    <div className="page">
      <PageHeader eyebrow="MORIFAR INTELLIGENCE LAYER" title="Executive Copilot" subtitle="Ask operational questions and receive AI-generated, data-backed guidance." />
      <IntelligenceLinkBar />
      <section className="copilot-shell">
        <article className="panel copilot-panel">
          <div className="panel-head"><div><h2><IconBrain size={17} />Conversational command view</h2><p>Uses current Morifar OS records and rule-based AI provider abstraction.</p></div></div>
          <AiDisclosure />
          <form className="copilot-form">
            <input name="q" defaultValue={q} aria-label="Ask Executive Copilot" placeholder="Ask about clients, departments, approvals, workload or priorities..." />
            <button className="gold-button"><IconSearch size={15} />Ask</button>
          </form>
          <div className="chat-answer">
            <h2>{response.title}</h2>
            <p>{response.answer}</p>
          </div>
        </article>
        <aside className="panel">
          <div className="panel-head"><div><h2>Suggested prompts</h2><p>Start with operational questions leadership asks daily.</p></div></div>
          <div className="prompt-list">{prompts.map(prompt => <Link href={`/executive-copilot?q=${encodeURIComponent(prompt)}`} key={prompt}>{prompt}</Link>)}</div>
        </aside>
      </section>
    </div>
  );
}
