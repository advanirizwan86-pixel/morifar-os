import Link from "next/link";
import {IconFilter, IconSearch, IconUserPlus} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {listLeads} from "@/server/repositories/crm";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{q?: string; status?: string; created?: string}>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const status = params.status ?? "all";
  const leads = listLeads(q, status);

  return (
    <div className="page">
      <PageHeader
        eyebrow="CRM - OPPORTUNITY PIPELINE"
        title="Leads"
        subtitle="Qualify, route and convert every commercial opportunity."
        action={<Link className="gold-button" href="/leads/new"><IconUserPlus size={18} />New lead</Link>}
      />
      {params.created && <div className="success-banner">Lead created and routed successfully: <strong>{params.created}</strong></div>}
      <section className="lead-summary">
        <div><small>ALL LEADS</small><strong>{listLeads().length}</strong></div>
        <div><small>NEW</small><strong>{listLeads("", "new").length}</strong></div>
        <div><small>CONTACTED</small><strong>{listLeads("", "contacted").length}</strong></div>
        <div><small>QUALIFIED</small><strong>{listLeads("", "qualified").length}</strong></div>
      </section>
      <section className="panel lead-panel">
        <form className="lead-toolbar">
          <div className="field-search">
            <IconSearch size={18} />
            <input name="q" defaultValue={q} placeholder="Search leads..." aria-label="Search leads" />
          </div>
          <div className="toolbar-actions">
            <select name="status" defaultValue={status} aria-label="Lead status filter">
              <option value="all">All statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
            </select>
            <button><IconFilter size={16} />Apply filters</button>
          </div>
        </form>
        <div className="table-scroll">
          <table className="leads-table">
            <thead>
              <tr><th>LEAD</th><th>COUNTRY</th><th>SERVICE</th><th>PIPELINE</th><th>ASSIGNED AI</th><th>BUDGET</th><th>CREATED</th></tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id}>
                  <td><strong>{lead.name}</strong><small>{lead.email}</small></td>
                  <td>{lead.country}</td>
                  <td>{lead.service}</td>
                  <td><span className={`badge ${lead.status}`}>{lead.stage}</span></td>
                  <td><span className="assigned-dot" />{lead.ai_name}</td>
                  <td>{lead.budget}</td>
                  <td>{new Date(lead.created_at).toLocaleDateString("en-AE", {day: "numeric", month: "short", year: "numeric"})}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && <div className="empty-state"><IconSearch size={24} /><strong>No leads found</strong><p>Try a different search or status filter.</p></div>}
        </div>
      </section>
    </div>
  );
}
