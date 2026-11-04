export const clientStages = ["Enquiry", "Consultation", "Proposal & Payment", "Onboarding", "Execution", "Handover", "Retainer"] as const;
export const expiryTypes = ["Passport", "Visa", "Emirates ID", "Trade licence", "Ejari", "VAT deadline", "Corporate Tax deadline"] as const;
export const services = [
 {id:"residency",name:"Residency & Golden Visa Advisory",checks:["Assess eligibility and scope", "Collect and verify supporting documents", "Obtain human approval before submission", "Track application and hand over issued documents"]},
 {id:"formation",name:"Business & Company Formation",checks:["Agree jurisdiction, activity and structure", "Verify owners and managers", "Approve application and fees", "Track licence, registrations and handover"]},
 {id:"banking",name:"Banking & Financial Coordination",checks:["Confirm personal or corporate scope", "Collect bank-specific due-diligence requirements", "Review source-of-funds evidence", "Coordinate bank submission and follow-up"]},
 {id:"tax",name:"Accounting, Tax & Compliance",checks:["Confirm accounting period and engagement", "Collect books and registration records", "Assign VAT, Corporate Tax and audit deadlines", "Obtain qualified reviewer approval before filing"]},
 {id:"property",name:"Dubai Real Estate Acquisition",checks:["Record acquisition brief and budget", "Coordinate property and counterparty due diligence", "Review transaction documents with relevant advisers", "Track transfer and handover"]},
 {id:"relocation",name:"Family Relocation & Lifestyle Setup",checks:["Agree family settlement plan", "Coordinate schools, healthcare and driving licence", "Coordinate domestic staff and Ejari/DEWA/telecoms", "Confirm family settlement and handover"]},
 {id:"structuring",name:"Trusts, Foundations & Wealth Structuring",checks:["Record objectives, ownership and beneficiaries", "Coordinate legal and tax advice", "Complete due diligence and obtain human approval", "Track establishment and ongoing obligations"]},
 {id:"retainer",name:"Ongoing Private Client Support",checks:["Agree retainer scope and relationship manager", "Record annual renewals and continuing obligations", "Review outstanding requests weekly", "Approve client updates and renewal plan"]},
] as const;
export function daysUntil(date:string,today=new Date()):number {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Use a valid date");
 const due=Date.parse(date+"T00:00:00Z");
 if(!Number.isFinite(due)||new Date(due).toISOString().slice(0,10)!==date)throw new Error("Use a valid date");
 const day=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Dubai",year:"numeric",month:"2-digit",day:"2-digit"}).format(today);
 return Math.round((due-Date.parse(day+"T00:00:00Z"))/86400000);
}
export function expiryBand(days:number){return days<0?"Overdue":days<=30?"30 days":days<=60?"60 days":days<=90?"90 days":"Upcoming";}
export function assertDummyMode(env:Record<string,string|undefined>){
 if(env.MORIFAR_DATA_MODE && env.MORIFAR_DATA_MODE!=="dummy")throw new Error("Live client data is locked. Written approval of requirements 1–5 and verified production controls are required. This release supports dummy data only.");
}
