"use client";

import {useActionState, useMemo, useState} from "react";
import {RESET_CONFIRMATION, preservedRecords} from "@/features/admin/data-reset";
import {resetDemoDataAction} from "@/features/admin/actions";
import type {ResetPreviewItem} from "@/server/repositories/data-reset";

export function DataResetPanel({preview}: {preview: ResetPreviewItem[]}) {
  const [state, action, pending] = useActionState(resetDemoDataAction, {});
  const [confirmation, setConfirmation] = useState("");
  const total = useMemo(() => preview.reduce((sum, item) => sum + item.count, 0), [preview]);
  const canReset = confirmation === RESET_CONFIRMATION && total > 0;

  return (
    <div className="reset-panel">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Reset Preview</h2>
            <p>Operational demo/sample records that will be cleared.</p>
          </div>
          <strong className="reset-total">{total} records</strong>
        </div>
        <div className="reset-grid">
          {preview.map(item => (
            <div key={item.table}>
              <small>{item.table}</small>
              <strong>{item.count}</strong>
              <p>{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-grid reset-sections">
        <article className="panel">
          <div className="panel-head"><div><h2>Export Backup</h2><p>Download a JSON snapshot before clearing demo data.</p></div></div>
          <a className="gold-button" href="/admin/data-reset/export">Export demo data JSON</a>
        </article>
        <article className="panel">
          <div className="panel-head"><div><h2>Records Preserved</h2><p>These records are intentionally not removed.</p></div></div>
          <div className="preserved-list">
            {preservedRecords.map(record => <span key={record}>{record}</span>)}
          </div>
        </article>
      </section>

      <form action={action} className="panel reset-confirm-form">
        <div className="panel-head">
          <div>
            <h2>Confirm Reset</h2>
            <p>This clears demo data only. It cannot be undone without using the exported JSON snapshot.</p>
          </div>
        </div>
        <label>
          <span>Type confirmation phrase</span>
          <input
            name="confirmation"
            onChange={event => setConfirmation(event.target.value)}
            placeholder={RESET_CONFIRMATION}
            value={confirmation}
          />
        </label>
        {state.error && <p className="form-error">{state.error}</p>}
        {state.completed && <p className="form-success">Demo data reset complete. Deleted {state.deleted} records.</p>}
        <button className="gold-button danger-button" disabled={!canReset || pending} type="submit">
          {pending ? "Resetting..." : "Reset demo data"}
        </button>
      </form>
    </div>
  );
}

