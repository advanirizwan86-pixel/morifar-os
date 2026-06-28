export default function WorkflowEngineLoading() {
  return (
    <div className="page workflow-page">
      <div className="loading-heading" />
      <div className="workflow-loading-grid">{Array.from({length: 8}, (_, index) => <div key={index} />)}</div>
      <div className="workflow-loading-body"><div /><div /></div>
    </div>
  );
}
