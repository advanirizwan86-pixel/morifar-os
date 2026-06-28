"use client";
import {useActionState} from "react";
import {createClientOnboarding,createCompanyApplication} from "@/features/business-operations/actions";

type Option={id:string;name:string;email?:string};
type BusinessOptions={companies:Option[];clients:Option[];users:Option[];ai:Option[]};

function FieldError({message}:{message?:string}){return message?<em>{message}</em>:null}

export function CompanyApplicationForm({options}:{options:BusinessOptions}){
 const[state,action,pending]=useActionState(createCompanyApplication,{});
 return <form action={action} className="ops-form">
  <div className="form-grid">
   <label>Company<select name="company" required><option value="">Select company</option>{options.companies.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><FieldError message={state.errors?.company}/></label>
   <label>Client<select name="client"><option value="">No linked client</option>{options.clients.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
   <label>Jurisdiction<input name="jurisdiction" placeholder="Dubai Mainland" required/><FieldError message={state.errors?.jurisdiction}/></label>
   <label>Structure<select name="structure_type" required><option>Mainland</option><option>Free Zone</option><option>Offshore</option></select></label>
   <label className="full">Business activity<input name="business_activity" placeholder="Management consultancy" required/><FieldError message={state.errors?.business_activity}/></label>
   <label>Visa allocation<input name="visa_allocation" type="number" min="0" defaultValue="1"/><FieldError message={state.errors?.visa_allocation}/></label>
   <label>Office requirement<select name="office_requirement"><option>Virtual office acceptable</option><option>Serviced office required</option><option>Ejari office required</option><option>No office required</option></select></label>
   <label>Assigned consultant<select name="consultant">{options.users.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
   <label>Assigned AI<select name="ai"><option value="">Unassigned</option>{options.ai.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
   <label>Priority<select name="priority"><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option><option value="low">Low</option></select></label>
   <label className="full">Shareholders<textarea name="shareholders" rows={3} placeholder="One shareholder per line"/></label>
   <label className="full">Managers<textarea name="managers" rows={3} placeholder="One manager per line"/></label>
   <label className="full">Notes<textarea name="notes" rows={3}/></label>
   <label className="full">Internal comments<textarea name="internal_comments" rows={3}/></label>
  </div>
  {state.error&&<p className="form-error">{state.error}</p>}
  <div className="form-actions"><button className="gold-button" disabled={pending}>{pending?"Creating...":"Create application"}</button></div>
 </form>
}

export function ClientOnboardingForm(){
 const[state,action,pending]=useActionState(createClientOnboarding,{});
 return <form action={action} className="ops-form">
  <div className="form-grid">
   <label>Client<input name="client_name" required/><FieldError message={state.errors?.client_name}/></label>
   <label>Company<input name="company_name" required/><FieldError message={state.errors?.company_name}/></label>
   <label>Passport<input name="passport" placeholder="Passport number"/></label>
   <label>Emirates ID<input name="emirates_id" placeholder="Optional"/></label>
   <label>Phone<input name="phone" required/><FieldError message={state.errors?.phone}/></label>
   <label>Email<input name="email" type="email" required/><FieldError message={state.errors?.email}/></label>
   <label className="full">Address<input name="address" required/><FieldError message={state.errors?.address}/></label>
   <label>Nationality<input name="nationality" required/><FieldError message={state.errors?.nationality}/></label>
   <label>Service required<select name="service_required"><option>Company Formation</option><option>Client Onboarding</option><option>Document Collection</option><option>Advisory</option></select></label>
   <label>Source<select name="source"><option>Referral</option><option>Website</option><option>Partner</option><option>Existing client</option><option>Event</option></select></label>
   <label>Priority<select name="priority"><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option><option value="low">Low</option></select></label>
   <label>Risk level<select name="risk_level"><option>Low</option><option>Medium</option><option>High</option></select></label>
   <label className="full">Referral<input name="referral" placeholder="Referral source or partner"/></label>
  </div>
  <div className="form-actions"><button className="gold-button" disabled={pending}>{pending?"Creating...":"Create client profile"}</button></div>
 </form>
}
