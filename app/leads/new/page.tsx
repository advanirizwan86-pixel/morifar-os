import Link from "next/link";
import {IconArrowLeft} from "@tabler/icons-react";
import {LeadForm} from "@/components/lead-form";
export default function NewLeadPage(){return <div className="page narrow-page"><Link href="/leads" className="back-link"><IconArrowLeft size={17}/>Back to leads</Link><div className="form-heading"><p className="eyebrow">NEW OPPORTUNITY</p><h1>Create and route a lead</h1><p>Morifar OS will validate the enquiry, assign the relevant AI professional and record the activity.</p></div><LeadForm/></div>}
