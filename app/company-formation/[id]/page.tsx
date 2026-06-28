import Link from "next/link";
import {notFound} from "next/navigation";
import {IconArrowLeft,IconCalendarStats,IconFileCheck,IconHistory} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {getFormationApplication} from "@/server/repositories/business-operations";

export default async function FormationDetailPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params,data=getFormationApplication(id);
 if(!data)notFound();
 const {application,statusLogs,documents}=data;
 return <div className="page">
  <Link href="/company-formation" className="back-link"><IconArrowLeft size={14}/>Back to formation</Link>
  <PageHeader eyebrow="FORMATION FILE" title={application.company_name} subtitle={`${application.structure_type} - ${application.jurisdiction} - ${application.current_status.replaceAll("_"," ")}`}/>
  <section className="section-grid">
   <div className="panel"><div className="panel-head"><div><h2>Application profile</h2><p>Business setup details and ownership configuration</p></div></div><dl className="ops-detail-grid">
    <div><dt>Business activity</dt><dd>{application.business_activity}</dd></div>
    <div><dt>Office</dt><dd>{application.office_requirement}</dd></div>
    <div><dt>Visa allocation</dt><dd>{application.visa_allocation}</dd></div>
    <div><dt>Assigned consultant</dt><dd>{application.consultant_name??"Unassigned"}</dd></div>
    <div><dt>Assigned AI</dt><dd>{application.ai_name??"Unassigned"}</dd></div>
    <div><dt>Progress</dt><dd>{application.progress}%</dd></div>
   </dl><div className="ops-note"><strong>Notes</strong><p>{application.notes||"No notes recorded."}</p></div><div className="ops-note"><strong>Internal comments</strong><p>{application.internal_comments||"No internal comments recorded."}</p></div></div>
   <div className="panel"><div className="panel-head"><div><h2>Status timeline</h2><p>Every transition is logged</p></div><IconHistory size={18}/></div><div className="activity-list">{statusLogs.map(log=><div className="activity-item" key={log.id}><IconCalendarStats size={14}/><div><strong>{log.to_status.replaceAll("_"," ")}</strong><p>{log.from_status?`${log.from_status.replaceAll("_"," ")} to `:""}{log.to_status.replaceAll("_"," ")} - {log.notes}</p></div><time>{new Date(log.created_at).toLocaleDateString("en-AE",{day:"numeric",month:"short"})}</time></div>)}</div></div>
  </section>
  <section className="panel"><div className="panel-head"><div><h2>Required documents checklist</h2><p>Document collection connected to this formation file</p></div><Link href="/documents">Open documents</Link></div><div className="ops-doc-grid">{documents.map(doc=><div key={doc.id}><IconFileCheck size={16}/><strong>{doc.document_type}</strong><span className={`badge ${doc.status}`}>{doc.status}</span><p>{doc.notes??"No notes"}</p></div>)}</div></section>
 </div>
}
