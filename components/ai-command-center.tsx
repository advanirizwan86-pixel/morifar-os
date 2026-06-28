"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useActionState, useEffect, useMemo, useState} from "react";
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconBolt,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconRobot,
  IconRouteAltLeft,
  IconShieldCheck,
  IconTargetArrow,
  IconUserCheck,
  IconX,
} from "@tabler/icons-react";
import {
  approveAiTask,
  assignAiTask,
  escalateAiTask,
  reassignAiTask,
  rejectAiTask,
  toggleAiPause,
  type AssignAiTaskState,
} from "@/features/ai-command-center/actions";
import type {getAiCommandCenterData} from "@/server/repositories/ai-command-center";

type CommandCenterData = ReturnType<typeof getAiCommandCenterData>;
const initialAssignState: AssignAiTaskState = {};

function relativeTime(value: string) {
  const date = new Date(value);
  const minutes = Math.round((date.getTime() - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return new Intl.RelativeTimeFormat("en", {numeric: "auto"}).format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return new Intl.RelativeTimeFormat("en", {numeric: "auto"}).format(hours, "hour");
  return date.toLocaleDateString("en-AE", {day: "numeric", month: "short"});
}

const displayStatus = (status: string) => status.replaceAll("_", " ");

export function AiCommandCenter({
  data,
  notice,
  error,
}: {
  data: CommandCenterData;
  notice?: string;
  error?: string;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAi, setSelectedAi] = useState("");
  const [assignState, assignAction, assigning] = useActionState(assignAiTask, initialAssignState);
  const metrics = [
    {label: "TOTAL AI PROFESSIONALS", value: data.metrics.totalProfessionals, detail: "Managed workforce", icon: IconRobot},
    {label: "ACTIVE AI PROFESSIONALS", value: data.metrics.activeProfessionals, detail: "Available for work", icon: IconBolt},
    {label: "AI TASKS RUNNING", value: data.metrics.running, detail: "Executing now", icon: IconRefresh},
    {label: "NEEDING REVIEW", value: data.metrics.review, detail: "Human decision required", icon: IconUserCheck},
    {label: "COMPLETED TODAY", value: data.metrics.completedToday, detail: "Approved outcomes", icon: IconCircleCheck},
    {label: "FAILED / ESCALATED", value: data.metrics.failed, detail: "Require intervention", icon: IconAlertTriangle},
    {label: "AI PRODUCTIVITY", value: `${data.metrics.productivity}%`, detail: "Overall performance", icon: IconTargetArrow},
  ];
  const departmentLoad = useMemo(() => {
    const totals = new Map<string, {load: number; count: number}>();
    data.professionals.forEach(professional => {
      const current = totals.get(professional.department) ?? {load: 0, count: 0};
      totals.set(professional.department, {load: current.load + professional.workload, count: current.count + 1});
    });
    return Array.from(totals, ([department, value]) => ({
      department,
      workload: Math.round((value.load / (value.count * 10)) * 100),
    }));
  }, [data.professionals]);

  useEffect(() => {
    if (!assignState.success) return;
    setModalOpen(false);
    setSelectedAi("");
    router.refresh();
  }, [assignState.success, router]);

  function openAssignment(aiId = "") {
    setSelectedAi(aiId);
    setModalOpen(true);
  }

  return (
    <>
      {(notice || assignState.message) && (
        <div className="command-notice success" role="status">
          <IconCheck size={17} />
          <span>{assignState.message ?? notice}</span>
        </div>
      )}
      {error && (
        <div className="command-notice error" role="alert">
          <IconAlertTriangle size={17} />
          <span>{error}</span>
        </div>
      )}

      <section className="command-metrics" aria-label="AI workforce metrics">
        {metrics.map(metric => (
          <article key={metric.label}>
            <metric.icon size={18} />
            <small>{metric.label}</small>
            <strong>{metric.value}</strong>
            <p>{metric.detail}</p>
          </article>
        ))}
      </section>

      <div className="command-section-heading">
        <div>
          <p className="eyebrow">ACTIVE ROSTER</p>
          <h2>AI Professional Status</h2>
        </div>
        <button className="gold-button" onClick={() => openAssignment()}>
          <IconPlus size={17} />
          Assign new task
        </button>
      </div>

      {data.professionals.length ? (
        <section className="command-professional-grid">
          {data.professionals.map(professional => (
            <article className="command-professional" key={professional.id}>
              <header>
                <div className="large-avatar">{professional.avatar}</div>
                <span className={`command-status ${professional.status.toLowerCase().replace(" ", "-")}`}>
                  <i />
                  {professional.status}
                </span>
              </header>
              <h3>{professional.name}</h3>
              <p className="command-role">{professional.jobTitle} · {professional.department}</p>
              <dl>
                <div><dt>CURRENT TASK</dt><dd>{professional.currentTask ?? "Awaiting assignment"}</dd></div>
                <div><dt>CLIENT</dt><dd>{professional.assignedClient ?? "Internal operation"}</dd></div>
                <div><dt>PRIORITY</dt><dd className={`priority-text ${professional.priority ?? "low"}`}>{professional.priority ?? "none"}</dd></div>
                <div><dt>LAST ACTIVITY</dt><dd>{relativeTime(professional.lastActivity)}</dd></div>
              </dl>
              <Progress label="Progress" value={professional.progress} />
              <Progress label="Confidence" value={professional.confidence} confidence />
              <div className="command-workload">
                <span>Workload</span>
                <div>{Array.from({length: 10}, (_, index) => <i className={index < professional.workload ? "filled" : ""} key={index} />)}</div>
              </div>
              <footer>
                <Link href={`/ai-professionals/${professional.id}`}><IconArrowUpRight size={15} />View workspace</Link>
                <button onClick={() => openAssignment(professional.id)}><IconPlus size={15} />Assign task</button>
                <form action={toggleAiPause}>
                  <input type="hidden" name="aiId" value={professional.id} />
                  <input type="hidden" name="pause" value={String(!professional.isPaused)} />
                  <button
                    className="icon-command"
                    title={professional.isPaused ? "Resume AI" : "Pause AI"}
                    aria-label={professional.isPaused ? `Resume ${professional.name}` : `Pause ${professional.name}`}
                  >
                    {professional.isPaused ? <IconPlayerPlay size={15} /> : <IconPlayerPause size={15} />}
                  </button>
                </form>
              </footer>
            </article>
          ))}
        </section>
      ) : (
        <Empty icon={<IconRobot />} title="No AI professionals configured">
          Add AI professionals through the existing workforce configuration before assigning tasks.
        </Empty>
      )}

      <section className="command-split">
        <ActivityPanel activities={data.activities} />
        <PerformancePanel performance={data.performance} departmentLoad={departmentLoad} />
      </section>

      <TaskQueue tasks={data.tasks} professionals={data.professionals} />

      {modalOpen && (
        <AssignmentModal
          data={data}
          selectedAi={selectedAi}
          setSelectedAi={setSelectedAi}
          state={assignState}
          action={assignAction}
          pending={assigning}
          close={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

function Progress({label, value, confidence = false}: {label: string; value: number; confidence?: boolean}) {
  return (
    <div className={`command-progress-row ${confidence ? "confidence" : ""}`}>
      <span>{label} <b>{value}%</b></span>
      <i><b style={{width: `${value}%`}} /></i>
    </div>
  );
}

function Empty({icon, title, children}: {icon: React.ReactNode; title: string; children: React.ReactNode}) {
  return <div className="empty-state large">{icon}<strong>{title}</strong><p>{children}</p></div>;
}

function ActivityPanel({activities}: {activities: CommandCenterData["activities"]}) {
  return (
    <article className="panel command-activity-panel">
      <div className="panel-head">
        <div><h2>AI Live Activity</h2><p>Recent AI actions and review signals</p></div>
        <span className="live-indicator"><i />Live</span>
      </div>
      <div className="command-activity-list">
        {activities.map(activity => (
          <div key={activity.id}>
            <div className="activity-avatar">{activity.aiName.split(" ").map(part => part[0]).join("").slice(0, 2)}</div>
            <div>
              <strong>{activity.aiName}</strong>
              <p>{activity.action} <span>{activity.entityName}</span></p>
              <small>{activity.result}</small>
            </div>
            <div className="activity-result">
              <span className={`queue-status ${activity.status}`}>{displayStatus(activity.status)}</span>
              {activity.requiresApproval && <em><IconShieldCheck size={12} />Approval</em>}
              <time>{relativeTime(activity.createdAt)}</time>
            </div>
          </div>
        ))}
        {!activities.length && <Empty icon={<IconBolt />} title="No AI activity yet">New assignments and task decisions will appear here.</Empty>}
      </div>
    </article>
  );
}

function PerformancePanel({
  performance,
  departmentLoad,
}: {
  performance: CommandCenterData["performance"];
  departmentLoad: {department: string; workload: number}[];
}) {
  const rows = [
    ["TASKS COMPLETED", performance.completedToday],
    ["AVG. COMPLETION", performance.averageCompletionMinutes ? `${performance.averageCompletionMinutes}m` : "—"],
    ["CONFIDENCE", `${performance.averageConfidence}%`],
    ["ESCALATION RATE", `${performance.escalationRate}%`],
    ["HUMAN REVIEW", `${performance.humanReviewRate}%`],
    ["FAILED TASKS", performance.failed],
  ];
  return (
    <article className="panel command-performance">
      <div className="panel-head"><div><h2>AI Performance</h2><p>Today&apos;s workforce execution quality</p></div></div>
      <div className="performance-summary">
        {rows.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}
      </div>
      <div className="department-load">
        <small>DEPARTMENT WORKLOAD</small>
        {departmentLoad.map(item => (
          <div key={item.department}>
            <span>{item.department}<b>{item.workload}%</b></span>
            <i><b style={{width: `${item.workload}%`}} /></i>
          </div>
        ))}
      </div>
    </article>
  );
}

function TaskQueue({
  tasks,
  professionals,
}: {
  tasks: CommandCenterData["tasks"];
  professionals: CommandCenterData["professionals"];
}) {
  return (
    <section className="panel command-queue">
      <div className="panel-head">
        <div><h2>AI Task Queue</h2><p>Approve, reject, escalate, or reassign AI work</p></div>
        <span>{tasks.length} tasks</span>
      </div>
      {tasks.length ? (
        <div className="command-table-scroll">
          <table>
            <thead><tr><th>TASK</th><th>AI ASSIGNED</th><th>CLIENT</th><th>DEPARTMENT</th><th>PRIORITY</th><th>DUE</th><th>STATUS</th><th>CONFIDENCE</th><th>REVIEW</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td><strong>{task.title}</strong><small>{task.progress}% complete</small></td>
                  <td>{task.aiName}</td>
                  <td>{task.clientName ?? "Internal"}</td>
                  <td>{task.department}</td>
                  <td><span className={`priority ${task.priority}`}>{task.priority}</span></td>
                  <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-AE", {day: "numeric", month: "short"}) : "—"}</td>
                  <td><span className={`queue-status ${task.status}`}>{displayStatus(task.status)}</span></td>
                  <td>{task.confidence}%</td>
                  <td>{task.requiresHumanReview ? <span className="review-required">Required</span> : "No"}</td>
                  <td><TaskActions task={task} professionals={professionals} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty icon={<IconCircleCheck />} title="Task queue is clear">Assign a new AI task to begin execution.</Empty>
      )}
    </section>
  );
}

function TaskActions({
  task,
  professionals,
}: {
  task: CommandCenterData["tasks"][number];
  professionals: CommandCenterData["professionals"];
}) {
  const actionable = task.status !== "done";
  return (
    <>
      <div className="queue-actions">
        {actionable && <TaskAction action={approveAiTask} task={task} title="Approve task"><IconCheck size={14} /></TaskAction>}
        {actionable && <TaskAction action={rejectAiTask} task={task} title="Reject task"><IconX size={14} /></TaskAction>}
        {actionable && <TaskAction action={escalateAiTask} task={task} title="Escalate to human"><IconRouteAltLeft size={14} /></TaskAction>}
        <Link title="Open task" aria-label={`Open ${task.title}`} href={`/tasks#${task.id}`}><IconArrowUpRight size={14} /></Link>
      </div>
      {actionable && (
        <form action={reassignAiTask} className="reassign-form">
          <input type="hidden" name="taskId" value={task.id} />
          <select name="aiId" defaultValue={task.aiProfessionalId} aria-label={`Reassign ${task.title}`}>
            {professionals.filter(item => !item.isPaused).map(professional => (
              <option value={professional.id} key={professional.id}>{professional.name}</option>
            ))}
          </select>
          <button title="Reassign task"><IconRefresh size={13} /></button>
        </form>
      )}
    </>
  );
}

function TaskAction({
  action,
  task,
  title,
  children,
}: {
  action: (form: FormData) => Promise<void>;
  task: CommandCenterData["tasks"][number];
  title: string;
  children: React.ReactNode;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="taskId" value={task.id} />
      <button title={title} aria-label={`${title}: ${task.title}`}>{children}</button>
    </form>
  );
}

function AssignmentModal({
  data,
  selectedAi,
  setSelectedAi,
  state,
  action,
  pending,
  close,
}: {
  data: CommandCenterData;
  selectedAi: string;
  setSelectedAi: (value: string) => void;
  state: AssignAiTaskState;
  action: (payload: FormData) => void;
  pending: boolean;
  close: () => void;
}) {
  return (
    <div className="command-modal-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) close();
    }}>
      <div className="command-modal" role="dialog" aria-modal="true" aria-labelledby="assign-task-title">
        <header>
          <div><p className="eyebrow">NEW AI ASSIGNMENT</p><h2 id="assign-task-title">Assign task</h2></div>
          <button onClick={close} aria-label="Close assignment modal"><IconX size={19} /></button>
        </header>
        <form action={action}>
          <div className="command-form-grid">
            <Field label="Task title" error={state.errors?.title} full>
              <input name="title" required minLength={3} maxLength={180} placeholder="Prepare client formation checklist" />
            </Field>
            <Field label="Task description" error={state.errors?.description} full>
              <textarea name="description" required minLength={3} maxLength={2000} rows={4} placeholder="Describe the expected outcome and relevant context." />
            </Field>
            <Field label="AI Professional" error={state.errors?.aiProfessionalId}>
              <select name="aiProfessionalId" value={selectedAi} onChange={event => setSelectedAi(event.target.value)} required>
                <option value="">Select AI professional</option>
                {data.professionals.filter(item => !item.isPaused).map(professional => <option value={professional.id} key={professional.id}>{professional.name}</option>)}
              </select>
            </Field>
            <Field label="Client / company" error={state.errors?.clientId}>
              <select name="clientId">
                <option value="">Internal operation</option>
                {data.clients.map(client => <option value={client.id} key={client.id}>{client.name}{client.company_name ? ` · ${client.company_name}` : ""}</option>)}
              </select>
            </Field>
            <Field label="Department" error={state.errors?.departmentId}>
              <select name="departmentId" required>
                <option value="">Select department</option>
                {data.departments.map(department => <option value={department.id} key={department.id}>{department.name}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select>
            </Field>
            <Field label="Due date" error={state.errors?.dueDate}><input name="dueDate" type="date" required /></Field>
            <Field label="Related document">
              <input name="attachment" type="file" aria-describedby="attachment-note" />
              <small id="attachment-note">Attachment storage will connect in a later sprint.</small>
            </Field>
            <label className="command-checkbox full">
              <input name="requiresHumanReview" type="checkbox" />
              <span><IconShieldCheck size={17} />Requires human review before completion</span>
            </label>
          </div>
          <footer>
            <button type="button" className="secondary-button" onClick={close}>Cancel</button>
            <button className="gold-button" disabled={pending}>
              {pending ? <><IconClock size={17} />Assigning...</> : <><IconPlus size={17} />Assign task</>}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  full = false,
  children,
}: {
  label: string;
  error?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return <label className={full ? "full" : ""}>{label}{children}{error && <em>{error}</em>}</label>;
}
