import Link from "next/link";
import {IconArrowLeft} from "@tabler/icons-react";
import {taskFormOptions} from "@/server/repositories/tasks";
import {TaskForm} from "@/components/task-form";
import {TaskRecommendationPanel} from "@/components/intelligence-panels";
import {getTaskRecommendation} from "@/server/services/intelligence";
export const dynamic="force-dynamic";
export default function NewTaskPage(){return <div className="page"><Link href="/tasks" className="back-link"><IconArrowLeft size={17}/>Back to tasks</Link><div className="form-heading"><p className="eyebrow">NEW WORK ITEM</p><h1>Create a task</h1><p>Assign accountable work to a human colleague or AI professional.</p></div><div className="recommendation-layout"><TaskForm options={taskFormOptions()}/><TaskRecommendationPanel recommendation={getTaskRecommendation()}/></div></div>}
