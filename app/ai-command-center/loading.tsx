export default function AiCommandCenterLoading() {
  return (
    <div className="page command-center-page" aria-label="Loading AI Command Center">
      <div className="loading-heading" />
      <div className="command-loading-grid">
        {Array.from({length: 7}, (_, index) => <div key={index} />)}
      </div>
      <div className="command-loading-body">
        <div />
        <div />
      </div>
    </div>
  );
}
