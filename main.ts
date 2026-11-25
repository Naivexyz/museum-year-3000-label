// Museum of the Year 3000 — a single museum label, printed by a program.
//
// The competition asks for one line: the label a museum in the year 3000
// puts next to an ordinary object from today. The judge reads labels two
// at a time and picks the funnier one, so this file holds exactly one line
// and nothing else. It is written out verbatim, with no trailing newline,
// so the file the judge sees is the label and only the label.
//
// Picked object: a plastic fork. A visitor from the year 3000 has never
// seen one used, so the label misreads it as a tiny trident — and the joke
// is the arithmetic: nine minutes of use, a thousand years in the ground,
// millions of them dug up since.
//
// Runtime: Node 22+. Only erasable TypeScript is used here (plain type
// annotations, no enums or other runtime syntax), so `node main.ts` runs
// it directly under the harness's Node 22.

import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// The winning label. Exactly one line, English, original, at most
// 200 characters. Counted by hand and checked again at runtime.
const LABEL =
  "Plastic fork (c. 2025). A single-use trident for eating. Used once, for about nine minutes, then buried for a thousand years. Archaeologists have found millions.";

// Longest label the gate will accept, in characters.
const LIMIT = 200;

// Where the label goes. The harness collects /output/entry.txt; setting
// MAKEFUN_OUTPUT_DIR points the same write at a scratch folder instead,
// which is how the entry is tested locally without touching /output.
function outputFolder(): string {
  const override = process.env.MAKEFUN_OUTPUT_DIR;
  if (override !== undefined && override.trim() !== "") {
    return override;
  }
  return "/output";
}

// Refuse to ship a label that would fail the gate, instead of writing a
// broken file and hoping nobody notices. Each failure names itself.
function checkLabel(text: string): void {
  if (text.length === 0) {
    throw new Error("label is empty");
  }
  if (text.trim().length === 0) {
    throw new Error("label is only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("label must be a single line with no line breaks");
  }
  // Any other control character would be invisible junk in the label,
  // and a tab would read as a formatting accident on a museum plaque.
  for (const ch of text) {
    if (ch.charCodeAt(0) < 0x20 && ch !== " ") {
      throw new Error(
        `label holds a control character (U+${ch.charCodeAt(0).toString(16).padStart(4, "0")})`,
      );
    }
  }
  if (text.length > LIMIT) {
    throw new Error(
      `label is ${text.length} characters, over the ${LIMIT} limit`,
    );
  }
}

function main(): void {
  checkLabel(LABEL);

  const folder = outputFolder();
  mkdirSync(folder, { recursive: true, mode: 0o755 });

  const target = join(folder, "entry.txt");
  // No trailing newline: the file holds the label and nothing else.
  writeFileSync(target, LABEL, { encoding: "utf8" });
  // The grader collects outputs as another user, so the file must be
  // readable by everyone, not just whoever ran this program.
  chmodSync(target, 0o644);

  // Prove the write landed exactly: read it back and compare it byte
  // for byte with the label, so a partial write or stray newline can
  // never slip through silently.
  const written = readFileSync(target, { encoding: "utf8" });
  if (written !== LABEL) {
    throw new Error(`${target} does not match the label after writing`);
  }

  console.log(`wrote ${target} (${LABEL.length} characters)`);
}

main();
