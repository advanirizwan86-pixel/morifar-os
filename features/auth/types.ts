export const roles=["Super Admin","CEO","COO","Manager","Consultant","Sales","Finance","Legal","HR"] as const;
export type Role=typeof roles[number];
export type SessionUser={id:string;name:string;email:string;role:Role;avatar:string};
