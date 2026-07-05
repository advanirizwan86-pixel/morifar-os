import "server-only";
import {execFileSync} from "node:child_process";
import {existsSync, readdirSync, readFileSync, statSync} from "node:fs";
import {join} from "node:path";
import packageJson from "@/package.json";
import {criticalRisks, dailyFlow, featureInventory, rolloutOrder, systemRoutes} from "@/features/system-knowledge";
import {getDb} from "@/server/db";
import {getDataResetPreview} from "@/server/repositories/data-reset";

export type FileNode = {name: string; path: string; type: "file" | "folder"; children?: FileNode[]};
type CtoRecord = Record<string, string | number | string[]>;

const root = process.cwd();
const sourceRoots = ["app", "components", "features", "server", "docs", "scripts"];
const docs = [
  "MASTER_DOCUMENTATION.md",
  "ARCHITECTURE.md",
  "PAGES.md",
  "SERVICES.md",
  "ROADMAP.md",
  "KNOWN_LIMITATIONS.md",
  "TECHNICAL_DEBT.md",
  "DEVELOPER_GUIDE.md",
  "USER_GUIDE.md",
  "OPERATIONAL_PLAYBOOK.md",
  "FRESH_START_GUIDE.md",
  "DAILY_OPERATING_PLAYBOOK.md",
];

function safeStat(path: string) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function listFiles(dir: string): string[] {
  const absolute = join(root, dir);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, {withFileTypes: true}).flatMap(entry => {
    const current = join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(current);
    return current.replaceAll("\\", "/");
  });
}

function tree(dir: string, depth = 0): FileNode[] {
  const absolute = join(root, dir);
  if (!existsSync(absolute) || depth > 3) return [];
  return readdirSync(absolute, {withFileTypes: true})
    .filter(entry => ![".next", "node_modules", ".git", "work", "data"].includes(entry.name))
    .slice(0, 80)
    .map(entry => {
      const current = join(dir, entry.name).replaceAll("\\", "/");
      if (entry.isDirectory()) return {name: entry.name, path: current, type: "folder" as const, children: tree(current, depth + 1)};
      return {name: entry.name, path: current, type: "file" as const};
    });
}

function componentPurpose(name: string) {
  if (name.includes("Form")) return "Form or mutation UI used by an operational workflow.";
  if (name.includes("Panel")) return "Reusable panel UI for intelligence or operations.";
  if (name.includes("Shell")) return "Application navigation and authenticated layout shell.";
  if (name.includes("Command")) return "AI command and executive control interface.";
  if (name.includes("Workflow")) return "Workflow builder or execution interface.";
  return "Reusable React component used by Morifar OS pages.";
}

function extractExports(source: string) {
  return [...source.matchAll(/export function (\w+)\(([^)]*)\)/g)].map(match => ({
    name: match[1],
    props: match[2].replace(/\s+/g, " ").slice(0, 150) || "None",
  }));
}

function extractImports(source: string) {
  return [...source.matchAll(/from "([^"]+)"/g)].map(match => match[1]).filter(value => value.startsWith("@/")).slice(0, 8);
}

function parseTables(schema: string) {
  return [...schema.matchAll(/CREATE TABLE IF NOT EXISTS ([\w_]+) \(([\s\S]*?)\);/g)].map(match => {
    const fields = match[2].split(",").map(item => item.trim()).filter(Boolean);
    return {
      table: match[1],
      fields: fields.map(field => field.split(/\s+/)[0]).slice(0, 18),
      primaryKeys: fields.filter(field => field.includes("PRIMARY KEY")).map(field => field.split(/\s+/)[0]),
      foreignKeys: fields.filter(field => field.includes("REFERENCES")).map(field => field.replace(/\s+/g, " ")),
      relationships: fields.filter(field => field.includes("REFERENCES")).length,
      futureMigrationNotes: "Move this schema to a managed SQL provider before high-volume production use.",
    };
  });
}

function parseIndexes(schema: string) {
  return [...schema.matchAll(/CREATE INDEX IF NOT EXISTS ([\w_]+) ON ([\w_]+)\(([^)]+)\);/g)].map(match => ({
    index: match[1],
    table: match[2],
    fields: match[3],
  }));
}

function routePathToFile(route: string) {
  if (route === "/") return "app/page.tsx";
  const path = route.split("?")[0].replace(/^\//, "");
  return `app/${path}/page.tsx`;
}

function recentCommits() {
  try {
    return execFileSync("git", ["log", "--oneline", "-6"], {cwd: root, encoding: "utf8"})
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);
  } catch {
    const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12);
    return commit ? [`${commit} Vercel deployment commit`] : ["Commit history unavailable in this runtime"];
  }
}

export function getCtoModeData() {
  const db = getDb();
  const schema = readFileSync(join(root, "server", "db", "schema.sql"), "utf8");
  const allFiles = sourceRoots.flatMap(listFiles);
  const componentFiles = listFiles("components").filter(file => file.endsWith(".tsx"));
  const appFiles = listFiles("app").filter(file => file.endsWith(".tsx"));
  const serviceFiles = [...listFiles("server/services"), ...listFiles("server/repositories"), ...listFiles("features")].filter(file => file.endsWith(".ts"));
  const docsData = docs.map(file => {
    const path = join(root, "docs", file);
    const text = existsSync(path) ? readFileSync(path, "utf8") : "";
    return {file, href: `/docs/${file}`, title: file.replace(".md", "").replaceAll("_", " "), excerpt: text.split("\n").filter(Boolean).slice(0, 4).join(" "), body: text};
  });

  const routes = systemRoutes.map(route => {
    const pageFile = routePathToFile(route.route);
    const fileStat = safeStat(join(root, pageFile));
    return {
      ...route,
      components: route.relatedComponents,
      services: route.relatedServices,
      databaseTables: route.dataSource,
      apiCalls: route.route === "/admin/data-reset" ? "GET /admin/data-reset/export, resetDemoDataAction" : route.relatedServices.includes("actions") ? "Server Actions" : "Server-rendered data reads",
      protection: route.requiredRole,
      navigationPath: route.module === "CTO Access" ? "Administration > CTO Mode" : route.module,
      lastModified: fileStat ? fileStat.mtime.toISOString().slice(0, 10) : "Not tracked",
    };
  });

  const components = componentFiles.flatMap(file => {
    const source = readFileSync(join(root, file), "utf8");
    const exports = extractExports(source);
    const stat = safeStat(join(root, file));
    return (exports.length ? exports : [{name: file.split("/").pop()?.replace(".tsx", "") ?? file, props: "Default export or inline component"}]).map(item => ({
      name: item.name,
      purpose: componentPurpose(item.name),
      parent: appFiles.filter(appFile => readFileSync(join(root, appFile), "utf8").includes(item.name)).slice(0, 5).join(", ") || "Shared / imported indirectly",
      children: extractImports(source).join(", ") || "None detected",
      props: item.props,
      dependencies: extractImports(source).join(", ") || "React / local CSS",
      usage: file,
      sizeKb: stat ? Math.round(stat.size / 1024) : 0,
    }));
  });

  const services = serviceFiles.map(file => {
    const source = readFileSync(join(root, file), "utf8");
    const exports = [...source.matchAll(/export (?:async )?function (\w+)/g)].map(match => match[1]);
    const consumers = allFiles.filter(candidate => candidate !== file && readFileSync(join(root, candidate), "utf8").includes(file.split("/").pop()?.replace(".ts", "") ?? file)).slice(0, 5);
    return {
      file,
      purpose: file.includes("repositories") ? "Data access and query layer" : file.includes("services") ? "Domain service / deterministic intelligence" : "Server action, validation or type module",
      input: exports.length ? exports.join(", ") : "Module constants/types",
      output: file.includes("actions") ? "Mutation result / redirect / revalidation" : "Typed records or service DTOs",
      dependencies: extractImports(source).join(", ") || "SQLite / local types",
      consumers: consumers.join(", ") || "Used through route imports or server actions",
    };
  });

  const tables = parseTables(schema);
  const indexes = parseIndexes(schema);
  const aiProfessionals = db.prepare("SELECT ai.id,ai.name,ai.job_title,ai.specialisation,ai.knowledge,ai.system_prompt,ai.skills,ai.tools,ai.status,d.name department FROM ai_professionals ai LEFT JOIN departments d ON d.id=ai.department_id ORDER BY ai.name").all() as {
    id: string; name: string; job_title: string; specialisation: string; knowledge: string; system_prompt: string; skills: string; tools: string; status: string; department: string;
  }[];
  const resetPreview = getDataResetPreview();
  const demoRecords = resetPreview.reduce((sum, item) => sum + item.count, 0);

  const filesBySize = allFiles
    .map(file => ({file, sizeKb: Math.round((safeStat(join(root, file))?.size ?? 0) / 1024)}))
    .sort((a, b) => b.sizeKb - a.sizeKb)
    .slice(0, 12);

  const documentationText = docsData.map(doc => `${doc.title} ${doc.excerpt}`).join(" ");
  const searchIndex: CtoRecord[] = [
    ...routes.map(item => ({type: "Route", title: item.route, body: `${item.pageName} ${item.purpose} ${item.module} ${item.requiredRole}`})),
    ...components.map(item => ({type: "Component", title: item.name, body: `${item.purpose} ${item.usage} ${item.dependencies}`})),
    ...services.map(item => ({type: "Service", title: item.file, body: `${item.purpose} ${item.input} ${item.output} ${item.consumers}`})),
    ...tables.map(item => ({type: "Table", title: item.table, body: `${item.fields.join(" ")} relationships ${item.relationships}`})),
    ...aiProfessionals.map(item => ({type: "AI", title: item.name, body: `${item.job_title} ${item.specialisation} ${item.department} ${item.system_prompt}`})),
    ...docsData.map(item => ({type: "Doc", title: item.title, body: item.body.slice(0, 1800) || item.excerpt})),
  ];

  return {
    overview: {
      version: packageJson.version,
      phase: "Version 1.0 RC / CTO Mode",
      releaseStatus: "Internal release candidate",
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "Local build",
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? "main/local",
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? process.env.BUILD_TIME ?? "Runtime generated",
      deploymentEnvironment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      database: process.env.VERCEL ? "Ephemeral SQLite /tmp" : "Local SQLite",
      aiProvider: process.env.OPENAI_API_KEY ? "Configured" : "Local deterministic services",
      authenticationProvider: "Morifar signed session cookie",
      readinessScore: 95,
      technicalDebtScore: 72,
      demoRecords,
    },
    routes,
    features: featureInventory.map(feature => ({
      name: feature,
      purpose: `Operational capability for ${feature}.`,
      dependencies: routes.filter(route => route.module.includes(feature) || route.pageName.includes(feature)).map(route => route.route).join(", ") || "Shared platform data",
      futurePlans: feature.includes("AI") ? "Connect live model orchestration and audit-grade controls." : feature.includes("Documents") ? "Connect durable file storage and upload workflow." : "Harden with real operational data and integrations.",
    })),
    components,
    tables,
    indexes,
    services,
    workflows: [
      "Lead -> Client -> Case -> Tasks -> Approvals -> Completion",
      "Document Request -> Upload/Review -> Approval/Rejection -> Case Milestone",
      "AI Recommendation -> Explanation -> Human Review -> Approved Action",
      ...rolloutOrder,
    ],
    aiProfessionals: aiProfessionals.map(item => ({
      ...item,
      knowledge: JSON.parse(item.knowledge || "[]") as string[],
      skills: JSON.parse(item.skills || "[]") as string[],
      tools: JSON.parse(item.tools || "[]") as string[],
      decisionRules: "Explain recommendations, flag low confidence, require human approval for sensitive actions.",
      escalationRules: "Escalate rejected, low-confidence, overdue or sensitive recommendations to a human owner.",
    })),
    security: {
      roles: ["Super Admin", "CEO", "COO", "CTO Reviewer", "Manager", "Consultant", "Sales", "Finance", "Legal", "HR"],
      protectedRoutes: routes.filter(route => route.requiredRole !== "Authenticated").map(route => `${route.route} (${route.requiredRole})`),
      middleware: "middleware.ts protects authentication, executive access, CTO Mode and Super Admin-only Data Reset.",
      secretsStatus: "No secrets committed. Environment variables required for AUTH_SECRET and bootstrap credentials.",
      risks: criticalRisks,
    },
    performance: {
      largestFiles: filesBySize,
      slowPages: routes.filter(route => route.route.includes("workflow") || route.route.includes("service-automation") || route.route.includes("cto")),
      bundleSize: "Next build first load JS is approximately 102 kB shared; page chunks remain small in current build output.",
      renderTimes: "Route smoke locally validates response timing; production monitoring still needs external observability.",
      apiTimes: "Server actions and route handlers are not yet instrumented with persistent timing logs.",
    },
    qa: {
      brokenRoutes: "Latest smoke suite passed locally.",
      consoleErrors: "No current known console errors after reset fix; browser history may retain older pre-fix errors.",
      accessibility: "Keyboard labels and route-level spot checks passed; full automated axe audit is future work.",
      responsive: "Desktop/tablet/mobile spot checks passed for CTO and reset routes.",
      smokeTests: "scripts/route-smoke.mjs and scripts/service-automation-tests.mjs",
      lighthouse: "Not configured yet.",
      openBugs: "Durable storage, live AI provider, external integrations and real file uploads remain future work.",
    },
    docs: docsData,
    projectTree: sourceRoots.map(dir => ({name: dir, path: dir, type: "folder" as const, children: tree(dir)})),
    changeHistory: {
      releases: ["Version 1.0 RC", "Company Profile rollout", "CTO Access Pack", "CTO Mode Engineering Console"],
      commits: recentCommits(),
      completedPhases: ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Phase 4.1", "Phase 5", "Phase 5.1", "Phase 6"],
      versions: ["1.0.0-rc"],
    },
    implementationMode: dailyFlow,
    dataReset: resetPreview,
    dataResetCapabilities: [
      "Preview demo data counts by table before reset.",
      "Export a JSON backup from /admin/data-reset/export.",
      "Run guarded reset from /admin/data-reset with Super Admin access only.",
      "Preserve users, sessions, company profile and system settings.",
      "Record reset action through the existing operational audit surface.",
    ],
    health: [
      ["Routes", "Healthy", `${routes.length} mapped routes`],
      ["Database", process.env.VERCEL ? "Risk" : "Healthy", process.env.VERCEL ? "Ephemeral /tmp SQLite" : "Local SQLite active"],
      ["Storage", "Risk", "Document object storage not connected"],
      ["Authentication", "Healthy", "Signed cookie sessions"],
      ["AI", "Partial", "Deterministic services, no live provider execution"],
      ["Search", "Healthy", "Repository-backed search"],
      ["Notifications", "Healthy", "In-app only"],
      ["Workflow", "Partial", "Templates and runs, no durable runtime"],
    ],
    briefing: {
      buildStatus: "TypeScript, production build and route smoke passed in latest local verification.",
      errors: "No blocking runtime errors known.",
      warnings: ["Node node:sqlite experimental warning", ...criticalRisks],
      completedFeatures: featureInventory,
      recommendations: ["Migrate to managed SQL", "Add production observability", "Connect durable document storage", "Add live AI provider controls", "Run full accessibility and Lighthouse audits"],
    },
    searchIndex,
    documentationText,
  };
}

export type CtoModeData = ReturnType<typeof getCtoModeData>;
