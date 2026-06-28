import Link from "next/link";
export default function NotFound(){return <div className="error-state"><span className="error-code">404</span><h2>Page not found</h2><p>The requested workspace or record does not exist.</p><Link className="gold-button" href="/dashboard">Return to dashboard</Link></div>}
