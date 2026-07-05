"use client";

import Link from "next/link";
import {useMemo, useState} from "react";
import type {CtoModeData, FileNode} from "@/server/repositories/cto-mode";

function Card({children, title}: {children: React.ReactNode; title: string}) {
  return <article className="panel cto-module"><h2>{title}</h2>{children}</article>;
}

function MiniTable({rows}: {rows: Array<Record<string, string | number | string[]>>}) {
  const keys = Object.keys(rows[0] ?? {}).slice(0, 7);
  if (!rows.length) return <p className="muted-copy">No records found.</p>;
  return (
    <div className="table-scroll">
      <table>
        <thead><tr>{keys.map(key => <th key={key}>{key}</th>)}</tr></thead>
        <tbody>
          {rows.slice(0, 40).map((row, index) => (
            <tr key={index}>{keys.map(key => <td key={key}>{Array.isArray(row[key]) ? row[key].join(", ") : String(row[key] ?? "")}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tree({nodes}: {nodes: FileNode[]}) {
  return (
    <ul className="cto-tree">
      {nodes.map(node => (
        <li key={node.path}>
          <span>{node.type === "folder" ? "Folder" : "File"} · {node.path}</span>
          {node.children && node.children.length > 0 && <Tree nodes={node.children} />}
        </li>
      ))}
    </ul>
  );
}

export function CtoModeConsole({data}: {data: CtoModeData}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return data.searchIndex.slice(0, 12);
    return data.searchIndex.filter(item => `${item.type} ${item.title} ${item.body}`.toLowerCase().includes(value)).slice(0, 30);
  }, [data.searchIndex, query]);

  return (
    <div className="cto-console">
      <section className="panel cto-search-panel">
        <div>
          <p className="eyebrow">SEARCH EVERYTHING</p>
          <h2>Global CTO Search</h2>
          <p>Search routes, components, features, pages, tables, services, AI professionals and documentation.</p>
        </div>
        <input aria-label="Search CTO Mode" onChange={event => setQuery(event.target.value)} placeholder="Search routes, tables, services, docs..." value={query} />
        <div className="cto-search-results">
          {results.map((item, index) => <div key={`${item.type}-${item.title}-${index}`}><small>{item.type}</small><strong>{item.title}</strong><p>{item.body}</p></div>)}
        </div>
      </section>

      <section className="kpi-grid system-kpi-grid">
        {Object.entries(data.overview).map(([key, value]) => (
          <div className="kpi-card" key={key}><small>{key.replace(/([A-Z])/g, " $1").toUpperCase()}</small><strong>{String(value)}</strong><p>CTO system overview</p></div>
        ))}
      </section>

      <div className="cto-module-grid">
        <Card title="01 System Overview">
          <p className="muted-copy">Current version, release state, build identity, environment, database, AI provider, auth provider and readiness.</p>
        </Card>
        <Card title="02 Live System Map">
          <MiniTable rows={data.routes.map(route => ({route: route.route, purpose: route.purpose, module: route.module, roles: route.requiredRole, components: route.components, services: route.services, lastModified: route.lastModified}))} />
        </Card>
        <Card title="03 Complete Feature Map">
          <div className="cto-card-grid">{data.features.map(feature => <div key={feature.name}><strong>{feature.name}</strong><p>{feature.purpose}</p><small>{feature.dependencies}</small><em>{feature.futurePlans}</em></div>)}</div>
        </Card>
        <Card title="04 Component Explorer">
          <MiniTable rows={data.components.map(component => ({name: component.name, purpose: component.purpose, parent: component.parent, props: component.props, dependencies: component.dependencies, usage: component.usage, sizeKb: component.sizeKb}))} />
        </Card>
        <Card title="05 Database Explorer">
          <MiniTable rows={data.tables.map(table => ({table: table.table, fields: table.fields, primaryKeys: table.primaryKeys, relationships: table.relationships, foreignKeys: table.foreignKeys.slice(0, 2).join(" | "), futureMigrationNotes: table.futureMigrationNotes}))} />
          <div className="cto-card-grid compact">{data.indexes.map(index => <div key={index.index}><strong>{index.index}</strong><p>{index.table}</p><small>{index.fields}</small></div>)}</div>
        </Card>
        <Card title="06 Service Explorer">
          <MiniTable rows={data.services.map(service => ({file: service.file, purpose: service.purpose, input: service.input, output: service.output, dependencies: service.dependencies, consumers: service.consumers}))} />
        </Card>
        <Card title="07 Workflow Visualizer">
          <ol className="ordered-playbook">{data.workflows.map(step => <li key={step}>{step}</li>)}</ol>
        </Card>
        <Card title="08 AI Explorer">
          <div className="cto-card-grid">{data.aiProfessionals.map(ai => <div key={ai.id}><strong>{ai.name}</strong><p>{ai.job_title} · {ai.department}</p><small>{ai.system_prompt}</small><em>{ai.decisionRules}</em></div>)}</div>
        </Card>
        <Card title="09 Route Explorer">
          <MiniTable rows={data.routes.map(route => ({route: route.route, status: route.status, protection: route.protection, components: route.components, navigationPath: route.navigationPath, brokenDetection: "Covered by route smoke"}))} />
        </Card>
        <Card title="10 Security Dashboard">
          <div className="cto-card-grid"><div><strong>Roles</strong><p>{data.security.roles.join(", ")}</p></div><div><strong>Middleware</strong><p>{data.security.middleware}</p></div><div><strong>Secrets</strong><p>{data.security.secretsStatus}</p></div></div>
        </Card>
        <Card title="11 Performance Dashboard">
          <p className="muted-copy">{data.performance.bundleSize}</p>
          <MiniTable rows={data.performance.largestFiles.map(file => ({file: file.file, sizeKb: file.sizeKb}))} />
        </Card>
        <Card title="12 QA Dashboard">
          <div className="cto-card-grid compact">{Object.entries(data.qa).map(([key, value]) => <div key={key}><strong>{key}</strong><p>{String(value)}</p></div>)}</div>
        </Card>
        <Card title="13 Documentation">
          <div className="cto-card-grid">{data.docs.map(doc => <Link href={doc.href} key={doc.file}><strong>{doc.title}</strong><p>{doc.excerpt}</p></Link>)}</div>
        </Card>
        <Card title="14 Project Tree">
          <Tree nodes={data.projectTree} />
        </Card>
        <Card title="15 Change History">
          <div className="cto-card-grid compact"><div><strong>Releases</strong><p>{data.changeHistory.releases.join(", ")}</p></div><div><strong>Commits</strong><p>{data.changeHistory.commits.join(" | ")}</p></div><div><strong>Phases</strong><p>{data.changeHistory.completedPhases.join(", ")}</p></div><div><strong>Versions</strong><p>{data.changeHistory.versions.join(", ")}</p></div></div>
        </Card>
        <Card title="16 Implementation Mode">
          <ol className="ordered-playbook">{data.implementationMode.map(step => <li key={step}>{step}</li>)}</ol>
        </Card>
        <Card title="17 Data Reset">
          <Link className="gold-button" href="/admin/data-reset">Open Data Reset</Link>
          <ol className="ordered-playbook">{data.dataResetCapabilities.map(item => <li key={item}>{item}</li>)}</ol>
          <MiniTable rows={data.dataReset.map(item => ({table: item.table, label: item.label, count: item.count}))} />
        </Card>
        <Card title="18 System Health">
          <div className="cto-card-grid compact">{data.health.map(([area, status, detail]) => <div key={area}><strong>{area}</strong><p>{status}</p><small>{detail}</small></div>)}</div>
        </Card>
        <Card title="19 Search Everything">
          <p className="muted-copy">Use the search box at the top of CTO Mode. It indexes {data.searchIndex.length} engineering, product and documentation records.</p>
        </Card>
        <Card title="20 Daily CTO Briefing">
          <p className="muted-copy">{data.briefing.buildStatus}</p>
          <div className="cto-card-grid compact"><div><strong>Warnings</strong><p>{data.briefing.warnings.join(" ")}</p></div><div><strong>Recommendations</strong><p>{data.briefing.recommendations.join(" ")}</p></div></div>
        </Card>
      </div>
    </div>
  );
}
