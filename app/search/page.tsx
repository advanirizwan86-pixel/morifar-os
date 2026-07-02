import Link from "next/link";
import {IconArrowUpRight, IconSearch} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {globalSearch} from "@/server/repositories/search";

export const dynamic = "force-dynamic";

export default async function SearchPage({searchParams}: {searchParams: Promise<{q?: string}>}) {
  const {q = ""} = await searchParams;
  const results = globalSearch(q);

  return (
    <div className="page narrow-page">
      <PageHeader eyebrow="GLOBAL INDEX" title="Search Morifar OS" subtitle="Find clients, companies, tasks and AI professionals." />
      <form className="search-page-form">
        <IconSearch size={20} />
        <input name="q" defaultValue={q} autoFocus placeholder="Search across the operating system..." aria-label="Search Morifar OS" />
        <button className="gold-button">Search</button>
      </form>
      {q && <p className="result-count">{results.length} results for "{q}"</p>}
      <section className="search-results">
        {results.map(result => (
          <Link href={result.href} key={`${result.type}-${result.id}`}>
            <span>{result.type}</span>
            <div><strong>{result.title}</strong><p>{result.subtitle}</p></div>
            <IconArrowUpRight size={16} />
          </Link>
        ))}
        {q.length >= 2 && results.length === 0 && (
          <div className="empty-state"><IconSearch /><strong>No results</strong><p>Try a broader name, company or task keyword.</p></div>
        )}
      </section>
    </div>
  );
}
