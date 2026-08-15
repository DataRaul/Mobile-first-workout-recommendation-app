import assert from "node:assert/strict";
import fs from "node:fs";

const styles = fs.readFileSync("styles.css", "utf8");
const mobileBlock = styles.match(/@media \(max-width: 480px\)\s*\{([\s\S]*)\}\s*$/)?.[1] || "";

assert.doesNotMatch(
  mobileBlock,
  /\.rir-field\s*\{[^}]*display:\s*none/s,
  "RIR must remain visible on narrow mobile screens",
);
assert.match(
  mobileBlock,
  /grid-template-columns:\s*30px repeat\(3, minmax\(0, 1fr\)\) 42px/,
  "the mobile set row must reserve columns for weight, repetitions and RIR",
);

console.log("Mobile workout logging regression checks passed.");
