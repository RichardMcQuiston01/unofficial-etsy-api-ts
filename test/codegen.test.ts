import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const docsDir = fileURLToPath(new URL("../docs", import.meta.url));

// Mirrors scripts/codegen.ts's findLatestSpecFile() so this test always
// checks the same spec file the generator actually used, instead of a
// filename that would silently drift out of sync with a future spec bump.
function parseSemver(fileName: string): [number, number, number] {
  const [major, minor, patch] = fileName.replace(".json", "").split(".").map(Number);
  return [major ?? 0, minor ?? 0, patch ?? 0];
}

function findLatestSpecFileName(): string {
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

function readGenerated(fileName: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../src/generated/${fileName}`, import.meta.url)),
    "utf-8",
  );
}

function readSpec(specFileName: string): {
  paths: Record<string, Record<string, { operationId: string }>>;
  components: { schemas: Record<string, unknown> };
} {
  const raw = readFileSync(
    fileURLToPath(new URL(`../docs/${specFileName}`, import.meta.url)),
    "utf-8",
  );
  return JSON.parse(raw) as ReturnType<typeof readSpec>;
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
const specFileName = findLatestSpecFileName();

describe(`generated code (src/generated/**), from docs/${specFileName}`, () => {
  const spec = readSpec(specFileName);
  const schemasSource = readGenerated("schemas.ts");
  const operationsSource = readGenerated("operations.ts");

  it("re-exports every schema from components.schemas", () => {
    const schemaNames = Object.keys(spec.components.schemas);
    expect(schemaNames.length).toBeGreaterThan(0);
    for (const name of schemaNames) {
      // Prettier line-wraps long declarations, so match tokens rather than a single line.
      expect(schemasSource).toContain(`export type ${name} =`);
      expect(schemasSource).toContain(`components["schemas"]["${name}"];`);
    }
  });

  it("generates a Response type for every operationId in the spec", () => {
    const operationIds: string[] = [];
    for (const pathItem of Object.values(spec.paths)) {
      for (const method of HTTP_METHODS) {
        const op = pathItem[method];
        if (op) operationIds.push(op.operationId);
      }
    }
    expect(operationIds.length).toBeGreaterThan(0);

    for (const operationId of operationIds) {
      const pascal = operationId.charAt(0).toUpperCase() + operationId.slice(1);
      expect(operationsSource).toContain(`export type ${pascal}Response`);
    }
  });

  it("carries the AUTO-GENERATED banner naming the source spec file in every generated file", () => {
    for (const source of [schemasSource, operationsSource, readGenerated("openapi.ts")]) {
      expect(source).toContain(`AUTO-GENERATED from docs/${specFileName} by scripts/codegen.ts`);
    }
  });
});
