export const roles=["Super Admin","CEO","COO","CTO Reviewer","Manager","Consultant","Sales","Finance","Legal","HR","PRO","Reception","Accounts"] as const;
export type Role=typeof roles[number];
export type SessionUser={id:string;name:string;email:string;role:Role;avatar:string;mfaVerified?:boolean;authVersion?:number};
