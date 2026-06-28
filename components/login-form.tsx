"use client";
import {useActionState} from "react";
import {login} from "@/features/auth/actions";
import {IconArrowRight,IconLock,IconMail} from "@tabler/icons-react";
export function LoginForm(){const[state,action,pending]=useActionState(login,{});return <form action={action} className="auth-form"><label>Email address<div><IconMail size={17}/><input name="email" type="email" autoComplete="email" required/></div></label><label>Password<div><IconLock size={17}/><input name="password" type="password" autoComplete="current-password" minLength={8} required/></div></label>{state.error&&<p className="form-error">{state.error}</p>}<button className="gold-button" disabled={pending}>{pending?"Signing in…":"Sign in to Morifar OS"}<IconArrowRight size={18}/></button></form>}
