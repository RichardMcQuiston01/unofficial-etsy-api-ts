import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const docsDir = fileURLToPath(new URL("../../docs", import.meta.url));

// Mirrors scripts/codegen.ts's findLatestSpecFile() so this test always
// checks the same spec file the generator actually used, instead of a
// filename that would silently drift out of sync with a future spec bump.
function parseSemver(fileName: string): [number, number, number] {
  const [major, minor, patch] = fileName.replace(".json", "").split(".").map(Number);
  return [major ?? 0, minor ?? 0, patch ?? 0];
}

export function findLatestSpecFileName(): string {
  const versioned = readdirSync(docsDir)
    .filter((name) => /^\d+\.\d+\.\d+\.json$/.test(name))
    .sort((a, b) => {
      const [aMajor, aMinor, aPatch] = parseSemver(a);
      const [bMajor, bMinor, bPatch] = parseSemver(b);
      return aMajor - bMajor || aMinor - bMinor || aPatch - bPatch;
    });
  const latest = versioned.at(-1);
  if (!latest) {
    throw new Error(`No docs/<major>.<minor>.<patch>.json spec file found in ${docsDir}`);
  }
  return latest;
}
