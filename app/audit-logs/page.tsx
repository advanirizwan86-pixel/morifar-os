import {IconLockCheck} from "@tabler/icons-react";
import {PageHeader} from "@/components/page-header";
import {listAuditLogs} from "@/server/repositories/business-operations";

export default function AuditLogsPage(){
 const rows=listAuditLogs();
 return <div className="page">
  <PageHeader eyebrow="IMMUTABLE AUDIT HISTORY" title="Audit Logs" subtitle="Who, what, when, before, after, IP placeholder and reason for operational events."/>
  <section className="table-panel"><table><thead><tr><th>WHEN</th><th>ACTOR</th><th>ACTION</th><th>ENTITY</th><th>BEFORE</th><th>AFTER</th><th>IP</th><th>REASON</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{new Date(row.created_at).toLocaleString("en-AE",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"})}</td><td><strong>{row.actor_name}</strong><small>{row.actor_type}</small></td><td>{row.action.replaceAll("_"," ")}</td><td>{row.entity_type}<small>{row.entity_id}</small></td><td>{row.before_value??"-"}</td><td>{row.after_value??"-"}</td><td>{row.ip_address}</td><td>{row.reason??"-"}</td></tr>)}</tbody></table>{rows.length===0&&<div className="empty-state"><IconLockCheck/><strong>No audit logs</strong><p>Immutable audit history will appear here.</p></div>}</section>
 </div>
}
