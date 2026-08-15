import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { APP_VERSION } from "../src/config.js";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
const worker = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");

assert.equal(packageJson.version, APP_VERSION);
assert.match(app, /App & data settings · Version \${APP_VERSION}/);
assert.ok(worker.includes(`v${APP_VERSION}`), "service-worker cache must include the app version");

console.log(`Application, Profile and cache versions align at ${APP_VERSION}.`);
