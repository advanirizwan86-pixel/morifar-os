import Link from "next/link";
import {IconArrowUpRight,IconBuildingSkyscraper,IconChecklist,IconClock,IconFileCheck,IconGitBranch,IconShieldCheck} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {getBusinessOperationsDashboard} from "@/server/repositories/business-operations";

const modules=[
 {href:"/company-formation",label:"Company Formation",copy:"Applications, milestones, documents and consultants.",icon:IconBuildingSkyscraper},
 {href:"/client-onboarding",label:"Client Onboarding",copy:"Capture client profile, source, risk and service intent.",icon:IconChecklist},
 {href:"/documents",label:"Document Collection",copy:"Track requested, rejected, approved and expiring documents.",icon:IconFileCheck},
 {href:"/approvals",label:"Approvals",copy:"Decisions for documents, applications, tasks and workflows.",icon:IconShieldCheck},
 {href:"/timeline",label:"Activity Timeline",copy:"Chronological human, AI and workflow activity.",icon:IconClock},
 {href:"/department-queues",label:"Department Queues",copy:"Filtered operational queues for every team.",icon:IconGitBranch},
];

export default function BusinessOperationsPage(){
 const data=getBusinessOperationsDashboard();
 const metrics=[
  ["APPLICATIONS",data.metrics.applications],
  ["ACTIVE",data.metrics.activeApplications],
  ["DOCS PENDING",data.metrics.documentsPending],
  ["APPROVALS",data.metrics.approvalsPending],
  ["QUEUE OPEN",data.metrics.queueOpen],
  ["AUDIT EVENTS",data.metrics.auditEvents],
 ];
 return <div className="page">
  <PageHeader eyebrow="BUSINESS OPERATIONS ENGINE" title="Operations Command" subtitle="Modular, auditable business processes for Morifar's day-to-day work." action={<Link className="gold-button" href="/company-formation">New application</Link>}/>
  <section className="kpi-grid">{metrics.map(([label,value])=><div className="kpi-card" key={String(label)}><small>{label}</small><strong>{value}</strong><p>Live operational count</p></div>)}</section>
  <section className="ops-module-grid">{modules.map(item=><Link href={item.href} className="ops-module-card" key={item.href}><item.icon size={20}/><div><h2>{item.label}</h2><p>{item.copy}</p></div><IconArrowUpRight size={15}/></Link>)}</section>
  <section className="section-grid">
   <div className="panel"><div className="panel-head"><div><h2>Formation applications</h2><p>Active company formation work</p></div><Link href="/company-formation">Open <IconArrowUpRight size={14}/></Link></div><div className="ops-list">{data.applications.slice(0,4).map(item=><div key={item.id}><strong>{item.company_name}</strong><span>{item.current_status.replaceAll("_"," ")} - {item.progress}%</span></div>)}</div></div>
   <div className="panel"><div className="panel-head"><div><h2>Approvals pending</h2><p>Human decisions required</p></div><Link href="/approvals">Review <IconArrowUpRight size={14}/></Link></div><div className="ops-list">{data.approvals.slice(0,4).map(item=><div key={item.id}><strong>{item.title}</strong><span>{item.priority} - {item.status}</span></div>)}</div></div>
  </section>
 </div>
}
