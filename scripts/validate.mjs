import fs from "node:fs";
import { execFileSync } from "node:child_process";

const required = [
  "index.html", "styles.css", "src/app.js", "src/config.js", "src/dataset.js",
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

for (const path of required.filter(path => path.endsWith(".js"))) {
  execFileSync(process.execPath, ["--check", path], { stdio: "inherit" });
}

console.log("Repository structure and JavaScript syntax validated.");
