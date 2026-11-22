[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/endg9/csv-reader-speed-01-v2/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/endg9/csv-reader-speed-01-v2/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

# csv-reader-speed-01-v2 — WASM SIMD drop-in for csv-reader 1.0.0

Bounty: **Read broken CSV files faster, 21 November 2026** — see the [make.fun bounty page](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
(`csv-reader-speed-01-run-20261121`, $100 total, 10 places × $10, closes
2026-11-23 09:42 WIB / 02:42 UTC). Final set drawn from drand round 34199652.

Entry: `solve.js` (ES module; `run(input)` → `{columns, rows, errors}` and a
`runAll(casesJson)` whole-file path) + `main.ts` (reads `/input/cases.json` as
bytes, hands it to the transducer, writes `/output/answers.json`) +
`package.json` + `LICENSE` (MIT, SPDX line).
Repo total ~18 KB — far under the 1 MiB cap. Node 22, no dependencies.

## Approach

A WebAssembly SIMD transducer (AssemblyScript, source `csv.ts` — kept in the
build workspace, the compiled module is embedded in `solve.js` as base64):

- **JSON-to-JSON transducer.** `main.ts` does no `JSON.parse`/`JSON.stringify`:
  the module parses `cases.json` itself (SIMD scan for `"`/`\`, full escape
  decoding incl. `\uXXXX` + surrogate pairs), answers every case, and emits
  the `answers.json` bytes directly.
- **SIMD field scan.** Unquoted fields are found with 16-byte `v128` scans
  for `,`/`\n`/`\r`; quoted fields with the same for `"`/`\n`/`\r`. One pass,
  left to right, exactly csv-reader 1.0.0's semantics: BOM dropped, CRLF and
  lone-CR rules, `""` → `"`, CR/LF inside quotes → LF, quote junk, stray CR,
  short/long rows, unterminated quotes (literal quote + re-read as unquoted).
- **Fused escape flag.** The scan that reads an unquoted field also computes
  whether its value needs a JSON escape (`"`, `\`, control byte); clean
  fields copy straight to the output with one `memory.copy`, no second scan.
  Quoted fields (assembled in scratch) are escape-scanned at emit.
- **Errors** are buffered per case and emitted in encounter order, with the
  record's `line`/`row` and the `fields`/`extra` payloads for short/long rows.

## Verification (local)

- Practice set: 6/6 answers identical to `expected.json` and to live
  csv-reader 1.0.0, via both the per-case `run()` and the `runAll()` path.
- Fuzz: 10,108 random broken-CSV cases, 0 mismatches vs csv-reader 1.0.0.
- Generator fuzz: 18 fresh cases drawn with the kit's own generator from 3
  different drand seeds, 0 mismatches.
- `grade-local --driver process`: all 6 practice cases pass.
