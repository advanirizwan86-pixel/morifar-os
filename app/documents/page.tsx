import Link from "next/link";
import {IconFilter,IconFileCheck,IconShieldCheck} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {updateDocumentRequest} from "@/features/business-operations/actions";
import {listDocumentRequests} from "@/server/repositories/business-operations";

export default async function DocumentsPage({searchParams}:{searchParams:Promise<{status?:string}>}){
 const {status="all"}=await searchParams,documents=listDocumentRequests({status});
 return <div className="page">
  <PageHeader eyebrow="DOCUMENT COLLECTION" title="Document Manager" subtitle="Secure checklist tracking for passports, visas, Emirates IDs, licences, MOA, POA, statements and photographs."/>
  <nav className="module-tabs">{["all","pending","uploaded","rejected","approved"].map(item=><Link key={item} className={status===item?"active":""} href={item==="all"?"/documents":`/documents?status=${item}`}>{item}</Link>)}</nav>
  <section className="table-panel"><table><thead><tr><th>DOCUMENT</th><th>CLIENT</th><th>COMPANY</th><th>STATUS</th><th>EXPIRY</th><th>REVIEWED BY</th><th>ACTION</th></tr></thead><tbody>{documents.map(doc=><tr key={doc.id}><td><strong>{doc.document_type}</strong><small>{doc.id}</small></td><td>{doc.client_name??"Unlinked"}</td><td>{doc.company_name??"Unlinked"}</td><td><span className={`badge ${doc.status}`}>{doc.status}</span></td><td>{doc.expiry_date?new Date(doc.expiry_date).toLocaleDateString("en-AE",{day:"numeric",month:"short",year:"numeric"}):"Not set"}</td><td>{doc.reviewed_by_name??"Pending"}</td><td><form action={updateDocumentRequest} className="ops-table-form"><input type="hidden" name="id" value={doc.id}/><select name="status" defaultValue={doc.status} aria-label={`Status for ${doc.document_type}`}><option>pending</option><option>uploaded</option><option>rejected</option><option>approved</option></select><input name="notes" placeholder="Notes" aria-label={`Review notes for ${doc.document_type}`}/><button aria-label={`Save document review for ${doc.document_type}`}><IconShieldCheck size={13}/>Save</button></form></td></tr>)}</tbody></table>{documents.length===0&&<div className="empty-state"><IconFileCheck/><strong>No documents</strong><p>No document requests match this filter.</p></div>}</section>
  <div className="routing-note"><IconFilter/><div><strong>Document workflow events</strong><p>Document reviews create audit log entries and approval records when approved or rejected.</p></div></div>
 </div>
}
