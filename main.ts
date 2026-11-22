// main.ts — the program the harness runs (node /bot/main.ts, node22).
// Reads /input/cases.json as bytes, hands the whole file to the WASM SIMD
// transducer (solve.js runAll), which parses the cases, answers each, and
// returns the answers.json bytes; writes them to /output/answers.json.
// Outside a container MAKEFUN_INPUT_DIR and MAKEFUN_OUTPUT_DIR stand in for
// /input and /output. (A per-case run() is also exported by solve.js and is
// used by the local test harness; the transducer path is what runs here.)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { setFlagsFromString } from "node:v8";

// V8's incremental marking off, set before solve.js is imported.
setFlagsFromString("--no-incremental-marking");

const { runAll } = await import(new URL("./solve.js", import.meta.url).href);

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? "/input";
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(OUTPUT_DIR, { recursive: true });

const casesJson = readFileSync(join(INPUT_DIR, "cases.json"));
const answersJson = runAll(casesJson);
writeFileSync(join(OUTPUT_DIR, "answers.json"), answersJson);
