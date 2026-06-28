export default function Loading(){return <div className="page"><div className="loading-heading"/><div className="loading-grid">{Array.from({length:6}).map((_,i)=><div key={i}/>)}</div></div>}
