"use client";
import {IconAlertTriangle} from "@tabler/icons-react";
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="error-state"><IconAlertTriangle size={30}/><h2>Something needs attention</h2><p>Morifar OS could not complete this request. No data was changed.</p><button className="gold-button" onClick={reset}>Try again</button></div>}
