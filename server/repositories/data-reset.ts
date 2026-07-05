import "server-only";
import {getDb} from "@/server/db";
import {resetTables} from "@/features/admin/data-reset";

export type ResetPreviewItem = {table: string; label: string; count: number};

export function getDataResetPreview(): ResetPreviewItem[] {
  const db = getDb();
  return resetTables.map(item => {
    const row = db.prepare(`SELECT COUNT(*) count FROM ${item.table}`).get() as {count: number};
    return {...item, count: row.count};
  });
}

export function exportDemoDataSnapshot() {
  const db = getDb();
  const exportedAt = new Date().toISOString();
  const tables = Object.fromEntries(
    resetTables.map(item => [item.table, db.prepare(`SELECT * FROM ${item.table}`).all()]),
  );
  return {exportedAt, tables};
}

export function resetDemoData() {
  const db = getDb();
  const before = getDataResetPreview();
  db.exec("BEGIN");
  try {
    resetTables.forEach(item => db.prepare(`DELETE FROM ${item.table}`).run());
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  return before;
}

