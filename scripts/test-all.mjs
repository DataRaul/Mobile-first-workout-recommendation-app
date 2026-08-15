import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const excluded = new Set([
  "test-all.mjs",
  // Requires an explicit path to the external 1,324-exercise source dataset.
  "test-recommendation-matrix.mjs",
]);

const tests = readdirSync(new URL(".", import.meta.url))
  .filter((name) => name.startsWith("test-") && name.endsWith(".mjs") && !excluded.has(name))
  .sort();

for (const test of tests) {
  console.log(`\n▶ ${test}`);
  const result = spawnSync(process.execPath, [new URL(test, import.meta.url).pathname], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`\nAll ${tests.length} self-contained regression files passed.`);
console.log("The external-source recommendation matrix remains available through npm run test:matrix -- --source <path>.");
