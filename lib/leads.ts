import { Lead, seedLeads } from "./data";

const STORAGE_KEY = "morifar-one-leads";

export function getLeads(): Lead[] {
  if (typeof window === "undefined") return seedLeads;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? [...JSON.parse(saved), ...seedLeads] : seedLeads;
  } catch {
    return seedLeads;
  }
}

export function saveLead(lead: Lead) {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  const custom: Lead[] = saved ? JSON.parse(saved) : [];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([lead, ...custom]));
}
