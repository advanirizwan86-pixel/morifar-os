import type {SessionUser} from "@/features/auth/types";
export const executives=["Super Admin","CEO","COO"];
export function canManage(user:SessionUser){return executives.includes(user.role);}
export function canManageStaff(user:SessionUser){return ["Super Admin","CEO"].includes(user.role);}
export function mayUpdateTask(user:SessionUser,assigned:string|null){return canManage(user)||(user.role!=="CTO Reviewer"&&assigned===user.id);}
export function mayReadTask(user:SessionUser,assigned:string|null){return canManage(user)||user.role==="CTO Reviewer"||assigned===user.id;}
export function maySeeContact(user:SessionUser){return canManage(user)||["Reception","Sales","Consultant","Manager"].includes(user.role);}
export function maySeeInvoices(user:SessionUser){return canManage(user)||["Accounts","Finance"].includes(user.role);}
