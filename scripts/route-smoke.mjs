const baseUrl = process.env.MORIFAR_BASE_URL ?? "http://127.0.0.1:3000";
const email = process.env.MORIFAR_REVIEW_EMAIL;
const password = process.env.MORIFAR_REVIEW_PASSWORD;

const routes = [
  "/dashboard",
  "/service-automation",
  "/crm",
  "/leads",
  "/leads/new",
  "/tasks",
  "/tasks/new",
  "/company-formation",
  "/documents",
  "/approvals",
  "/department-queues",
  "/ai-professionals",
  "/ai-command-center",
  "/workflow-engine",
  "/executive-copilot",
  "/client-intelligence",
  "/operations-intelligence",
  "/knowledge-base",
  "/settings",
  "/settings/company-profile",
  "/system-status",
  "/search?q=azm",
  "/notifications",
];

function decodeHtml(value) {
  return value.replaceAll("&quot;", "\"").replaceAll("&amp;", "&");
}

function inputValue(html, name) {
  const index = html.indexOf(`name="${name}"`);
  if (index < 0) return "";
  const match = html.slice(index, index + 700).match(/value="([\s\S]*?)"/);
  return match ? decodeHtml(match[1]) : "";
}

async function login() {
  if (!email || !password) {
    throw new Error("Set MORIFAR_REVIEW_EMAIL and MORIFAR_REVIEW_PASSWORD to run authenticated smoke tests.");
  }
  const loginHtml = await (await fetch(`${baseUrl}/login`)).text();
  const fields = {
    "$ACTION_REF_1": "",
    "$ACTION_1:0": inputValue(loginHtml, "$ACTION_1:0"),
    "$ACTION_1:1": inputValue(loginHtml, "$ACTION_1:1"),
    "$ACTION_KEY": inputValue(loginHtml, "$ACTION_KEY"),
    email,
    password,
  };
  const boundary = `----morifarSmoke${Math.random().toString(16).slice(2)}`;
  const body = Object.entries(fields)
    .map(([key, value]) => `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`)
    .join("") + `--${boundary}--\r\n`;
  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    body,
    headers: {"content-type": `multipart/form-data; boundary=${boundary}`},
    redirect: "manual",
  });
  const cookie = (response.headers.get("set-cookie") ?? "").match(/morifar_session=[^;]+/)?.[0] ?? "";
  if (response.status !== 303 || !cookie) throw new Error(`Login failed: ${response.status}`);
  return cookie;
}

const cookie = await login();
let failures = 0;
for (const route of routes) {
  const started = Date.now();
  const response = await fetch(`${baseUrl}${route}`, {headers: {cookie}, redirect: "manual"});
  const text = await response.text();
  const heading = (text.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
  const ok = response.status === 200 && heading.length > 0 && !text.includes("Application error");
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${response.status} ${String(Date.now() - started).padStart(4)}ms ${route} ${heading}`);
}

for (const route of ["/dashboard", "/executive-copilot", "/system-status"]) {
  const response = await fetch(`${baseUrl}${route}`, {redirect: "manual"});
  const location = response.headers.get("location") ?? "";
  const ok = response.status === 307 && location.includes("/login");
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${response.status} unauth ${route} -> ${location}`);
}

if (failures > 0) {
  console.error(`${failures} route smoke check(s) failed.`);
  process.exit(1);
}
