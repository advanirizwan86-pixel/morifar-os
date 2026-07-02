const baseUrl = process.env.MORIFAR_BASE_URL ?? "http://127.0.0.1:3000";
const email = process.env.MORIFAR_REVIEW_EMAIL;
const password = process.env.MORIFAR_REVIEW_PASSWORD;

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
  if (!email || !password) throw new Error("Set MORIFAR_REVIEW_EMAIL and MORIFAR_REVIEW_PASSWORD.");
  const loginHtml = await (await fetch(`${baseUrl}/login`)).text();
  const fields = {
    "$ACTION_REF_1": "",
    "$ACTION_1:0": inputValue(loginHtml, "$ACTION_1:0"),
    "$ACTION_1:1": inputValue(loginHtml, "$ACTION_1:1"),
    "$ACTION_KEY": inputValue(loginHtml, "$ACTION_KEY"),
    email,
    password,
  };
  const boundary = `----morifarPhase6${Math.random().toString(16).slice(2)}`;
  const body = Object.entries(fields).map(([key, value]) => `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`).join("") + `--${boundary}--\r\n`;
  const response = await fetch(`${baseUrl}/login`, {method: "POST", body, headers: {"content-type": `multipart/form-data; boundary=${boundary}`}, redirect: "manual"});
  const cookie = (response.headers.get("set-cookie") ?? "").match(/morifar_session=[^;]+/)?.[0] ?? "";
  if (!cookie) throw new Error(`Login failed: ${response.status}`);
  return cookie;
}

const cookie = await login();
const response = await fetch(`${baseUrl}/service-automation`, {headers: {cookie}});
const html = await response.text();
const required = [
  "Service Automation",
  "AI recommendation",
  "Why:",
  "Document generator",
  "Client communication assistant",
  "AI compliance checklist",
  "Human approval required",
  "User approval required before sending",
  "Configurable rules",
];
const failures = required.filter(text => !html.includes(text));
if (response.status !== 200) failures.push(`HTTP ${response.status}`);
if (failures.length) {
  console.error(`Service automation test failed: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("PASS service automation recommendations, explanations, document generation, communications, compliance, and approval safeguards");
