export type Professional = {
  id: string;
  name: string;
  specialty: string;
  initials: string;
  color: string;
  status: "Available" | "In session";
  leads: number;
  response: string;
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  country: string;
  service: string;
  budget: string;
  timeline: string;
  notes: string;
  professional: string;
  status: "New" | "Contacted" | "Qualified";
  createdAt: string;
};

export const professionals: Professional[] = [
  { id: "sarah", name: "Sarah Al-Harbi AI", specialty: "Saudi Company Formation", initials: "SA", color: "#b99252", status: "Available", leads: 18, response: "< 2 min" },
  { id: "aisha", name: "Aisha Al-Mansoori AI", specialty: "UAE Company Formation", initials: "AA", color: "#7a91a8", status: "Available", leads: 24, response: "< 1 min" },
  { id: "david", name: "David Morgan AI", specialty: "UK Expansion", initials: "DM", color: "#9d765e", status: "In session", leads: 11, response: "< 3 min" },
  { id: "emma", name: "Emma Clarke AI", specialty: "Canada Business", initials: "EC", color: "#738b81", status: "Available", leads: 9, response: "< 2 min" },
  { id: "arjun", name: "Arjun Mehta AI", specialty: "India Advisory", initials: "AM", color: "#8c7658", status: "Available", leads: 13, response: "< 2 min" },
  { id: "grace", name: "Grace AI", specialty: "Private Client Experience", initials: "G", color: "#8a7290", status: "Available", leads: 16, response: "< 1 min" },
  { id: "amir", name: "Amir AI", specialty: "GM Assistant", initials: "A", color: "#657fa1", status: "Available", leads: 21, response: "< 1 min" },
];

export const seedLeads: Lead[] = [
  { id: "LD-1048", name: "Nadia Al Qasimi", email: "nadia@qanara.ae", whatsapp: "+971 50 234 0198", country: "United Arab Emirates", service: "Company formation", budget: "$25k – $50k", timeline: "Within 30 days", notes: "Dubai mainland setup for a consultancy.", professional: "Aisha Al-Mansoori AI", status: "New", createdAt: "Jun 28, 2026" },
  { id: "LD-1047", name: "James Whitmore", email: "james@whitmore.co.uk", whatsapp: "+44 7700 900456", country: "United Kingdom", service: "Market expansion", budget: "$50k – $100k", timeline: "1–3 months", notes: "Exploring a new Middle East entity.", professional: "David Morgan AI", status: "Contacted", createdAt: "Jun 27, 2026" },
  { id: "LD-1046", name: "Faisal Alotaibi", email: "faisal@azm.sa", whatsapp: "+966 55 834 1120", country: "Saudi Arabia", service: "Company formation", budget: "$100k+", timeline: "Within 30 days", notes: "Technology venture aligned with Vision 2030.", professional: "Sarah Al-Harbi AI", status: "Qualified", createdAt: "Jun 26, 2026" },
  { id: "LD-1045", name: "Priya Sharma", email: "priya@newleaf.in", whatsapp: "+91 98765 44321", country: "India", service: "Advisory", budget: "$10k – $25k", timeline: "3–6 months", notes: "Cross-border operating advice.", professional: "Arjun Mehta AI", status: "Contacted", createdAt: "Jun 25, 2026" },
  { id: "LD-1044", name: "Ethan Laurent", email: "ethan@northline.ca", whatsapp: "+1 416 555 0182", country: "Canada", service: "Market expansion", budget: "$25k – $50k", timeline: "1–3 months", notes: "GCC distribution strategy.", professional: "Emma Clarke AI", status: "New", createdAt: "Jun 24, 2026" },
];

export function routeProfessional(country: string, service: string) {
  const value = `${country} ${service}`.toLowerCase();
  if (value.includes("saudi")) return professionals[0];
  if (value.includes("uae") || value.includes("emirates") || value.includes("dubai")) return professionals[1];
  if (value.includes("uk") || value.includes("united kingdom")) return professionals[2];
  if (value.includes("canada")) return professionals[3];
  if (value.includes("india")) return professionals[4];
  if (value.includes("private") || value.includes("concierge")) return professionals[5];
  return professionals[6];
}
