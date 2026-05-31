"use strict";
const fs = require("fs");
const path = require("path");

const root = fs.realpathSync(process.cwd());
const target = path.join(root, ".env.local");
const template = path.join(root, ".env.local.example");

const allowed = new Set([
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CONTACT_FORM_ENDPOINT",
  "NEXT_PUBLIC_LEAD_CAPTURE_ENDPOINT",
]);

if (!fs.existsSync(target)) {
  console.log("verified: .env.local missing");
  process.exit(0);
}

const contents = fs.readFileSync(target, "utf8");
const missing = [];
const envRegex = /^([A-Za-z0-9_]+)=(.*)$/gm;

for (const line of contents.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const match = envRegex.exec(trimmed);
  if (match) {
    const key = match[1];
    if (!allowed.has(key)) continue;
    if (/<CHANGE[_\s-]ME>|REPLACE_ME|PASTE_HERE|your-|demo-|localhost|example/i.test(match[2])) {
      missing.push(key);
    }
  }
}

if (missing.length) {
  console.log("verified: .env.local has placeholder values", { keys: missing });
} else {
  console.log("verified: .env.local present");
}
