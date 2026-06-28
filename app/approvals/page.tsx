import Link from "next/link";
import {IconChecks,IconShieldCheck} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {decideApproval} from "@/features/business-operations/actions";
import {listApprovals} from "@/server/repositories/business-operations";

export default async function ApprovalsPage({searchParams}:{searchParams:Promise<{status?:string}>}){
 const {status="all"}=await searchParams,approvals=listApprovals(status);
 return <div className="page">
  <PageHeader eyebrow="APPROVAL SYSTEM" title="Approvals" subtitle="Human decisions for documents, company applications, workflow steps, tasks and comments."/>
  <nav className="module-tabs">{["all","pending","approved","rejected","changes_requested","escalated"].map(item=><Link key={item} className={status===item?"active":""} href={item==="all"?"/approvals":`/approvals?status=${item}`}>{item.replaceAll("_"," ")}</Link>)}</nav>
  <section className="ops-card-list approvals-list">{approvals.map(item=><article className="ops-application-card" key={item.id}><header><div><IconShieldCheck size={18}/><h2>{item.title}</h2><p>{item.entity_type} - {item.entity_id}</p></div><span className={`priority ${item.priority}`}>{item.priority}</span></header><dl><div><dt>STATUS</dt><dd>{item.status.replaceAll("_"," ")}</dd></div><div><dt>REQUESTED BY</dt><dd>{item.requested_by_name??"System"}</dd></div><div><dt>ASSIGNED</dt><dd>{item.assigned_to_name??"Unassigned"}</dd></div><div><dt>AI</dt><dd>{item.ai_name??"None"}</dd></div></dl><p className="ops-copy">{item.reason??"No reason recorded."}</p><form action={decideApproval} className="ops-inline-form"><input type="hidden" name="id" value={item.id}/><select name="decision" defaultValue={item.status}><option value="approved">Approve</option><option value="rejected">Reject</option><option value="changes_requested">Request changes</option><option value="escalated">Escalate</option></select><input name="notes" placeholder="Decision notes"/><button><IconChecks size={14}/>Record</button></form></article>)}</section>
  {approvals.length===0&&<div className="empty-state"><IconShieldCheck/><strong>No approvals</strong><p>No approvals match this filter.</p></div>}
 </div>
}
