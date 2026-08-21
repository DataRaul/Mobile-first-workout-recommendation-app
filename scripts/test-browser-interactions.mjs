import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const customizationCopyPath = fileURLToPath(new URL("../src/customization-copy.js", import.meta.url));
const fixture = `<!doctype html>
<html><head><meta charset="utf-8"><title>Interaction stability smoke</title></head>
<body>
  <button id="routine" class="substitute-exercise" data-scope="routine" type="button">Substitute</button>
  <button id="sentinel" type="button">Tap sentinel</button>
  <script>
    window.copyMutations = 0;
    window.sentinelClicks = 0;
    const routine = document.querySelector("#routine");
    new MutationObserver((records) => {
      window.copyMutations += records.filter((record) => record.type === "childList").length;
    }).observe(routine, { childList: true });
    document.querySelector("#sentinel").addEventListener("click", () => { window.sentinelClicks += 1; });
  </script>
  <script type="module" src="/src/customization-copy.js"></script>
</body></html>`;

const server = createServer(async (request, response) => {
  if (request.url === "/__interaction_test__.html") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    response.end(fixture);
    return;
  }
  if (request.url === "/src/customization-copy.js") {
    response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
    response.end(await readFile(customizationCopyPath, "utf8"));
    return;
  }
  response.writeHead(404, { "Content-Type": "text/plain" });
  response.end("Not found");
});

await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});

const { port } = server.address();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(`http://127.0.0.1:${port}/__interaction_test__.html`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("#routine")?.textContent === "Replace");
  await page.waitForTimeout(100);
  const settledMutations = await page.evaluate(() => window.copyMutations);
  assert.equal(settledMutations, 1, "initial personalization should rewrite routine copy once");

  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => window.copyMutations), settledMutations, "observer must settle instead of continually rewriting its own DOM");

  await page.evaluate(() => {
    for (let index = 0; index < 30; index += 1) document.body.classList.toggle("observer-burst");
  });
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => window.copyMutations), settledMutations, "unrelated DOM mutation bursts must not rewrite settled controls");

  await page.click("#sentinel", { timeout: 1_000 });
  assert.equal(await page.evaluate(() => window.sentinelClicks), 1, "a normal tap must remain responsive after personalization observers run");
  assert.deepEqual(pageErrors, [], "browser fixture must not raise runtime errors");
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log("Chromium interaction smoke passed: observer settles and taps remain responsive.");
