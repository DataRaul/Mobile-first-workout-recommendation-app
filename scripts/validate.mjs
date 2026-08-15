import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const required = [
  "index.html", "styles.css", "src/app.js", "src/config.js", "src/dataset.js", "src/enrichment-rules.js",
  "src/programme.js", "src/storage.js", "service-worker.js", "manifest.webmanifest",
  "README.md", "NOTICE.md", "LICENSE"
];
const missing = required.filter(path => !fs.existsSync(path));
if (missing.length) {
  console.error("Missing files:", missing);
  process.exit(1);
}

JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
JSON.parse(fs.readFileSync("package.json", "utf8"));

const javascriptFiles = ["service-worker.js"];
for (const directory of ["src", "scripts"]) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isFile() && [".js", ".mjs"].includes(path.extname(entry.name))) {
      javascriptFiles.push(path.join(directory, entry.name));
    }
  }
}

for (const file of javascriptFiles.sort()) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

console.log("Repository structure and JavaScript syntax validated.");
