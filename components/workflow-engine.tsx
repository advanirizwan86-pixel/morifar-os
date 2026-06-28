"use client";

import Link from "next/link";
import {useActionState, useMemo, useState} from "react";
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconCopy,
  IconGitBranch,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShieldCheck,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import {
  approvalAction,
  pauseWorkflow,
  resumeWorkflow,
  saveWorkflow,
  startWorkflow,
  type WorkflowSaveState,
} from "@/features/workflow-engine/actions";
import {
  workflowNodeTypes,
  type WorkflowDefinition,
  type WorkflowEngineData,
  type WorkflowNode,
  type WorkflowNodeType,
  type WorkflowPriority,
  type WorkflowStatus,
} from "@/features/workflow-engine/types";

const initialSaveState: WorkflowSaveState = {};
const priorities: WorkflowPriority[] = ["low", "medium", "high", "urgent"];
const statuses: WorkflowStatus[] = ["draft", "active", "running", "paused", "completed", "failed"];

function newNode(type: WorkflowNodeType, x: number, y: number): WorkflowNode {
  return {
    id: `node_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`,
    type,
    name: type,
    description: "",
    department: "",
    assignedAi: "",
    assignedHuman: "",
    estimatedDuration: "30m",
    inputs: "",
    outputs: "",
    conditions: "",
    escalationRules: "",
    retryRules: "",
    approvalRequired: type === "Approval",
    priority: "medium",
    status: "ready",
    x,
    y,
  };
}

function minutes(value: number) {
  if (!value) return "-";
  if (value < 60) return `${value}m`;
  return `${Math.floor(value / 60)}h ${value % 60}m`;
}

export function WorkflowEngine({data, notice, error}: {data: WorkflowEngineData; notice?: string; error?: string}) {
  const [definition, setDefinition] = useState<WorkflowDefinition>(data.selectedDefinition);
  const [selectedNodeId, setSelectedNodeId] = useState(definition.nodes[0]?.id ?? "");
  const [name, setName] = useState(data.selectedWorkflow?.name ?? "New Workflow");
  const [description, setDescription] = useState(data.selectedWorkflow?.description ?? "");
  const [departmentId, setDepartmentId] = useState(data.selectedWorkflow?.departmentId ?? data.departments[0]?.id ?? "");
  const [country, setCountry] = useState(data.selectedWorkflow?.country ?? "United Arab Emirates");
  const [priority, setPriority] = useState<WorkflowPriority>(data.selectedWorkflow?.priority ?? "medium");
  const [status, setStatus] = useState<WorkflowStatus>(data.selectedWorkflow?.status ?? "draft");
  const [saveState, saveAction, saving] = useActionState(saveWorkflow, initialSaveState);
  const selectedNode = definition.nodes.find(node => node.id === selectedNodeId) ?? definition.nodes[0];
  const metrics = [
    ["TOTAL WORKFLOWS", data.metrics.totalWorkflows, "Templates and custom flows"],
    ["RUNNING WORKFLOWS", data.metrics.runningWorkflows, "Live executions"],
    ["PAUSED WORKFLOWS", data.metrics.pausedWorkflows, "Waiting to resume"],
    ["COMPLETED TODAY", data.metrics.completedToday, "Closed run instances"],
    ["FAILED WORKFLOWS", data.metrics.failedWorkflows, "Need attention"],
    ["AVG COMPLETION", minutes(data.metrics.averageCompletionTime), "Completed today"],
    ["AI TASKS RUNNING", data.metrics.aiTasksRunning, "AI-owned work"],
    ["HUMAN TASKS PENDING", data.metrics.humanTasksPending, "Human-owned work"],
  ];

  const edgePath = useMemo(() => definition.edges.map(edge => {
    const from = definition.nodes.find(node => node.id === edge.from);
    const to = definition.nodes.find(node => node.id === edge.to);
    if (!from || !to) return null;
    return {id: `${edge.from}-${edge.to}`, x1: from.x + 92, y1: from.y + 30, x2: to.x, y2: to.y + 30};
  }).filter(Boolean) as {id: string; x1: number; y1: number; x2: number; y2: number}[], [definition]);

  function updateNode(id: string, patch: Partial<WorkflowNode>) {
    setDefinition(current => ({...current, nodes: current.nodes.map(node => node.id === id ? {...node, ...patch} : node)}));
  }

  function addNode(type: WorkflowNodeType, x = 220, y = 170) {
    const node = newNode(type, x, y);
    setDefinition(current => {
      const last = current.nodes[current.nodes.length - 1];
      return {
        nodes: [...current.nodes, node],
        edges: last ? [...current.edges, {from: last.id, to: node.id}] : current.edges,
      };
    });
    setSelectedNodeId(node.id);
  }

  function removeSelected() {
    if (!selectedNode || ["Start", "End"].includes(selectedNode.type)) return;
    setDefinition(current => ({
      nodes: current.nodes.filter(node => node.id !== selectedNode.id),
      edges: current.edges.filter(edge => edge.from !== selectedNode.id && edge.to !== selectedNode.id),
    }));
    setSelectedNodeId(definition.nodes[0]?.id ?? "");
  }

  function duplicateSelected() {
    if (!selectedNode) return;
    addNode(selectedNode.type, selectedNode.x + 36, selectedNode.y + 36);
  }

  function dragNode(id: string, event: React.DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData("node-id", id);
  }

  function dropOnCanvas(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const type = event.dataTransfer.getData("node-type") as WorkflowNodeType;
    const nodeId = event.dataTransfer.getData("node-id");
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(20, Math.round(event.clientX - bounds.left));
    const y = Math.max(20, Math.round(event.clientY - bounds.top));
    if (nodeId) updateNode(nodeId, {x, y});
    if (type) addNode(type, x, y);
  }

  return (
    <>
      {(notice || saveState.message) && <div className="workflow-notice success"><IconCheck size={16} />{saveState.message ?? notice}</div>}
      {(error || saveState.error) && <div className="workflow-notice error"><IconAlertTriangle size={16} />{saveState.error ?? error}</div>}
      <section className="workflow-metrics">{metrics.map(([label, value, detail]) => <article key={label}><small>{label}</small><strong>{value}</strong><p>{detail}</p></article>)}</section>

      <WorkflowFilters data={data} />

      <section className="workflow-layout">
        <aside className="workflow-library panel">
          <div className="panel-head"><div><h2>Template Library</h2><p>Editable Morifar workflow templates</p></div></div>
          <div className="workflow-template-list">
            {data.workflows.map(workflow => (
              <Link href={`/workflow-engine?workflow=${workflow.id}`} className={workflow.id === data.selectedWorkflow?.id ? "active" : ""} key={workflow.id}>
                <strong>{workflow.name}</strong>
                <span>{workflow.department} / {workflow.nodes} nodes</span>
                <em className={`workflow-status ${workflow.status}`}>{workflow.status}</em>
              </Link>
            ))}
            {!data.workflows.length && <div className="empty-state"><IconSearch /><strong>No workflows found</strong><p>Adjust the search or filters to view matching workflows.</p></div>}
          </div>
        </aside>

        <section className="workflow-builder panel">
          <div className="workflow-builder-head">
            <div>
              <p className="eyebrow">VISUAL BUILDER</p>
              <h2>{name}</h2>
            </div>
            <div className="workflow-actions">
              {data.selectedWorkflow && (
                <>
                  <form action={startWorkflow}><input type="hidden" name="workflowId" value={data.selectedWorkflow.id} /><button><IconPlayerPlay size={15} />Run</button></form>
                  {data.selectedWorkflow.status === "paused" ? (
                    <form action={resumeWorkflow}><input type="hidden" name="workflowId" value={data.selectedWorkflow.id} /><button><IconRefresh size={15} />Resume</button></form>
                  ) : ["active", "running"].includes(data.selectedWorkflow.status) ? (
                    <form action={pauseWorkflow}><input type="hidden" name="workflowId" value={data.selectedWorkflow.id} /><button><IconPlayerPause size={15} />Pause</button></form>
                  ) : null}
                </>
              )}
              <button type="button" onClick={duplicateSelected}><IconCopy size={15} />Duplicate</button>
              <button type="button" onClick={removeSelected}><IconTrash size={15} />Delete</button>
            </div>
          </div>
          <div className="workflow-builder-grid">
            <div className="node-palette">
              {workflowNodeTypes.map(type => (
                <button draggable onDragStart={event => event.dataTransfer.setData("node-type", type)} onClick={() => addNode(type)} key={type}>
                  <IconPlus size={13} />{type}
                </button>
              ))}
            </div>
            <div className="workflow-canvas" onDragOver={event => event.preventDefault()} onDrop={dropOnCanvas}>
              <svg className="workflow-edges">{edgePath.map(edge => <line key={edge.id} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} />)}</svg>
              {definition.nodes.map(node => (
                <div
                  className={`workflow-node ${node.type.toLowerCase().replaceAll(" ", "-")} ${node.id === selectedNodeId ? "selected" : ""}`}
                  draggable
                  onDragStart={event => dragNode(node.id, event)}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{left: node.x, top: node.y}}
                  key={node.id}
                >
                  <span>{node.type}</span>
                  <strong>{node.name}</strong>
                  <small>{node.assignedAi || node.assignedHuman || node.department || "Unassigned"}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="workflow-config panel">
          <div className="panel-head"><div><h2>Node Configuration</h2><p>Step ownership, rules and outputs</p></div></div>
          <form action={saveAction} className="workflow-form">
            <input type="hidden" name="workflowId" value={data.selectedWorkflow?.id ?? ""} />
            <input type="hidden" name="definition" value={JSON.stringify(definition)} />
            <label>Workflow name<input name="name" value={name} onChange={event => setName(event.target.value)} /></label>
            <label>Description<textarea name="description" value={description} onChange={event => setDescription(event.target.value)} rows={3} /></label>
            <label>Department<select name="departmentId" value={departmentId} onChange={event => setDepartmentId(event.target.value)}>{data.departments.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
            <div className="workflow-two">
              <label>Country<input name="country" value={country} onChange={event => setCountry(event.target.value)} /></label>
              <label>Priority<select name="priority" value={priority} onChange={event => setPriority(event.target.value as WorkflowPriority)}>{priorities.map(item => <option key={item}>{item}</option>)}</select></label>
            </div>
            <label>Status<select name="status" value={status} onChange={event => setStatus(event.target.value as WorkflowStatus)}>{statuses.map(item => <option key={item}>{item}</option>)}</select></label>
            {selectedNode && <NodeEditor node={selectedNode} data={data} updateNode={updateNode} />}
            <button className="gold-button" disabled={saving}>{saving ? "Saving..." : "Save workflow"}</button>
          </form>
        </aside>
      </section>

      <section className="workflow-bottom">
        <LiveMonitor runs={data.runs} data={data} />
        <AuditLog logs={data.auditLogs} />
      </section>
    </>
  );
}

function WorkflowFilters({data}: {data: WorkflowEngineData}) {
  return (
    <form className="workflow-filters">
      <label className="workflow-search"><IconSearch size={16} /><input name="q" defaultValue={data.filters.q ?? ""} placeholder="Search client, company, department, workflow, AI or human" /></label>
      <select name="status" defaultValue={data.filters.status ?? "all"}><option value="all">All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select>
      <select name="department" defaultValue={data.filters.department ?? "all"}><option value="all">All departments</option>{data.departments.map(item => <option value={item.name} key={item.id}>{item.name}</option>)}</select>
      <select name="country" defaultValue={data.filters.country ?? "all"}><option value="all">All countries</option>{data.countries.map(item => <option key={item}>{item}</option>)}</select>
      <select name="priority" defaultValue={data.filters.priority ?? "all"}><option value="all">All priorities</option>{priorities.map(item => <option key={item}>{item}</option>)}</select>
      <input name="date" type="date" aria-label="Date filter" defaultValue={data.filters.date ?? ""} />
      <select name="ai" defaultValue={data.filters.ai ?? "all"}><option value="all">All AI professionals</option>{data.aiProfessionals.map(item => <option value={item.name} key={item.id}>{item.name}</option>)}</select>
      <select name="human" defaultValue={data.filters.human ?? "all"}><option value="all">All human users</option>{data.humans.map(item => <option value={item.name} key={item.id}>{item.name}</option>)}</select>
      <button><IconSearch size={15} />Filter</button>
    </form>
  );
}

function NodeEditor({node, data, updateNode}: {node: WorkflowNode; data: WorkflowEngineData; updateNode: (id: string, patch: Partial<WorkflowNode>) => void}) {
  const field = (key: keyof WorkflowNode, value: string | boolean) => updateNode(node.id, {[key]: value} as Partial<WorkflowNode>);
  return (
    <div className="node-editor">
      <div className="workflow-two">
        <label>Node type<select value={node.type} onChange={event => field("type", event.target.value)}>{workflowNodeTypes.map(type => <option key={type}>{type}</option>)}</select></label>
        <label>Status<input value={node.status} onChange={event => field("status", event.target.value)} /></label>
      </div>
      <label>Name<input value={node.name} onChange={event => field("name", event.target.value)} /></label>
      <label>Description<textarea value={node.description} onChange={event => field("description", event.target.value)} rows={3} /></label>
      <label>Department<select value={node.department} onChange={event => field("department", event.target.value)}><option value="">Unassigned</option>{data.departments.map(item => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
      <label>Assigned AI<select value={node.assignedAi} onChange={event => field("assignedAi", event.target.value)}><option value="">No AI</option>{data.aiProfessionals.map(item => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
      <label>Assigned Human<select value={node.assignedHuman} onChange={event => field("assignedHuman", event.target.value)}><option value="">No human</option>{data.humans.map(item => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
      <div className="workflow-two">
        <label>Estimated duration<input value={node.estimatedDuration} onChange={event => field("estimatedDuration", event.target.value)} /></label>
        <label>Priority<select value={node.priority} onChange={event => field("priority", event.target.value)}>{priorities.map(priority => <option key={priority}>{priority}</option>)}</select></label>
      </div>
      <label>Inputs<textarea value={node.inputs} onChange={event => field("inputs", event.target.value)} rows={2} /></label>
      <label>Outputs<textarea value={node.outputs} onChange={event => field("outputs", event.target.value)} rows={2} /></label>
      <label>Conditions<textarea value={node.conditions} onChange={event => field("conditions", event.target.value)} rows={2} /></label>
      <label>Escalation rules<textarea value={node.escalationRules} onChange={event => field("escalationRules", event.target.value)} rows={2} /></label>
      <label>Retry rules<textarea value={node.retryRules} onChange={event => field("retryRules", event.target.value)} rows={2} /></label>
      <label className="workflow-checkbox"><input type="checkbox" checked={node.approvalRequired} onChange={event => field("approvalRequired", event.target.checked)} />Approval required</label>
    </div>
  );
}

function LiveMonitor({runs, data}: {runs: WorkflowEngineData["runs"]; data: WorkflowEngineData}) {
  return (
    <section className="panel workflow-monitor">
      <div className="panel-head"><div><h2>Live Workflow Monitor</h2><p>Running workflow instances and operational risk</p></div></div>
      {runs.map(run => (
        <article key={run.id}>
          <div><strong>{run.workflowName}</strong><p>{run.client} / {run.company}</p></div>
          <div><small>CURRENT STEP</small><span>{run.currentStep}</span></div>
          <div><small>AI</small><span>{run.assignedAi}</span></div>
          <div><small>HUMAN</small><span>{run.assignedHuman}</span></div>
          <div className="workflow-run-progress"><small>{run.progress}%</small><i><b style={{width: `${run.progress}%`}} /></i></div>
          <div><small>ELAPSED</small><span>{minutes(run.elapsedMinutes)}</span></div>
          <div><small>RISK</small><em className={`risk ${run.riskLevel.toLowerCase()}`}>{run.riskLevel}</em></div>
          <div><small>STATUS</small><em className={`workflow-status ${run.status}`}>{run.status}</em></div>
          {run.currentStepType === "Approval" && ["running", "paused"].includes(run.status) && (
            <form action={approvalAction} className="approval-actions">
              <input type="hidden" name="runId" value={run.id} />
              <button name="decision" value="approve"><IconCheck size={13} />Approve</button>
              <button name="decision" value="reject"><IconX size={13} />Reject</button>
              <button name="decision" value="more_info"><IconClock size={13} />More info</button>
              <button name="decision" value="reassign"><IconGitBranch size={13} />Reassign</button>
              <button name="decision" value="escalate"><IconShieldCheck size={13} />Escalate</button>
            </form>
          )}
        </article>
      ))}
      {!runs.length && <div className="empty-state"><IconGitBranch /><strong>No live workflows</strong><p>Run a workflow from the builder to create a monitored instance.</p></div>}
      {data.clients.length > 0 && data.selectedWorkflow && (
        <form action={startWorkflow} className="workflow-run-form">
          <input type="hidden" name="workflowId" value={data.selectedWorkflow.id} />
          <select name="clientId"><option value="">Internal client</option>{data.clients.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
          <select name="companyId"><option value="">Morifar company</option>{data.companies.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
          <button className="gold-button"><IconPlayerPlay size={15} />Start selected workflow</button>
        </form>
      )}
    </section>
  );
}

function AuditLog({logs}: {logs: WorkflowEngineData["auditLogs"]}) {
  return (
    <section className="panel workflow-audit">
      <div className="panel-head"><div><h2>Audit Log</h2><p>Every workflow action, user and AI signal</p></div></div>
      <div>{logs.map(log => (
        <article key={log.id}>
          <time>{new Date(log.timestamp).toLocaleString("en-AE", {day: "numeric", month: "short", hour: "numeric", minute: "2-digit"})}</time>
          <strong>{log.action}</strong>
          <p>{log.user}{log.ai !== "None" ? ` / ${log.ai}` : ""}</p>
          <small>{log.oldValue || "-"} {"->"} {log.newValue || "-"}</small>
          {log.notes && <em>{log.notes}</em>}
        </article>
      ))}</div>
      {!logs.length && <div className="empty-state"><IconGitBranch /><strong>No audit activity</strong><p>Workflow edits and execution actions will appear here.</p></div>}
    </section>
  );
}
