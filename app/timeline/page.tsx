import {IconActivityHeartbeat} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {listTimeline} from "@/server/repositories/business-operations";

export default function TimelinePage(){
 const timeline=listTimeline();
 return <div className="page narrow-page">
  <PageHeader eyebrow="ACTIVITY TIMELINE" title="Timeline" subtitle="Chronological status changes, document events, tasks, approvals, AI actions, human actions, comments and notifications."/>
  <section className="notification-list ops-timeline">{timeline.map(item=><article key={`${item.source}-${item.id}`}><div className="notification-icon"><IconActivityHeartbeat size={18}/></div><div><strong>{item.actor}</strong><p>{item.action.replaceAll("_"," ")} - {item.entity_type} {item.entity_id}</p><time>{new Date(item.created_at).toLocaleString("en-AE",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"})}</time></div><span className={`badge ${item.source}`}>{item.source}</span></article>)}{timeline.length===0&&<div className="empty-state"><IconActivityHeartbeat/><strong>No timeline events</strong><p>Business operations activity will appear here.</p></div>}</section>
 </div>
}
