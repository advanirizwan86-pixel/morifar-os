import Link from "next/link";
import {IconArrowUpRight,IconBuildingSkyscraper,IconChecks,IconFileDescription} from "@tabler/icons-react";
import {CompanyApplicationForm} from "@/components/business-operation-forms";
import {PageHeader} from "@/components/page-header";
import {transitionFormationStatus} from "@/features/business-operations/actions";
import {businessFormOptions,formationStatuses,listFormationApplications} from "@/server/repositories/business-operations";

export default async function CompanyFormationPage({searchParams}:{searchParams:Promise<{status?:string;created?:string}>}){
 const params=await searchParams,status=params.status??"all",apps=listFormationApplications(status),options=businessFormOptions();
 return <div className="page">
  <PageHeader eyebrow="COMPANY FORMATION" title="Company Formation" subtitle="Applications, milestones, consultants, AI support, required documents and audit-backed transitions."/>
  {params.created&&<div className="success-banner">Application created: <strong>{params.created}</strong></div>}
  <section className="ops-board">
   <div className="panel ops-create-panel"><div className="panel-head"><div><h2>Create company application</h2><p>Start the formation workflow from an existing company/client.</p></div></div><CompanyApplicationForm options={options}/></div>
   <div className="ops-stack">
    <nav className="module-tabs"><Link className={status==="all"?"active":""} href="/company-formation">All</Link>{formationStatuses.map(item=><Link className={status===item?"active":""} href={`/company-formation?status=${item}`} key={item}>{item.replaceAll("_"," ")}</Link>)}</nav>
    <section className="ops-card-list">{apps.map(app=><article className="ops-application-card" key={app.id}>
     <header><div><IconBuildingSkyscraper size={18}/><h2>{app.company_name}</h2><p>{app.client_name??"No client linked"} - {app.jurisdiction}</p></div><span className={`priority ${app.priority}`}>{app.priority}</span></header>
     <div className="ops-progress"><span style={{width:`${app.progress}%`}}/><b>{app.progress}%</b></div>
     <dl>
      <div><dt>STATUS</dt><dd>{app.current_status.replaceAll("_"," ")}</dd></div>
      <div><dt>STRUCTURE</dt><dd>{app.structure_type}</dd></div>
      <div><dt>CONSULTANT</dt><dd>{app.consultant_name??"Unassigned"}</dd></div>
      <div><dt>AI</dt><dd>{app.ai_name??"Unassigned"}</dd></div>
      <div><dt>VISAS</dt><dd>{app.visa_allocation}</dd></div>
      <div><dt>OFFICE</dt><dd>{app.office_requirement}</dd></div>
     </dl>
     <form action={transitionFormationStatus} className="ops-inline-form"><input type="hidden" name="id" value={app.id}/><select name="next" defaultValue={app.current_status}>{formationStatuses.map(item=><option key={item} value={item}>{item.replaceAll("_"," ")}</option>)}</select><input name="notes" placeholder="Transition note"/><button><IconChecks size={14}/>Log transition</button></form>
     <footer><Link href={`/company-formation/${app.id}`}>Open file <IconArrowUpRight size={14}/></Link><span><IconFileDescription size={14}/>{JSON.parse(app.required_documents).length} required docs</span></footer>
    </article>)}</section>
    {apps.length===0&&<div className="empty-state"><IconBuildingSkyscraper/><strong>No applications</strong><p>No formation applications match this filter.</p></div>}
   </div>
  </section>
 </div>
}
