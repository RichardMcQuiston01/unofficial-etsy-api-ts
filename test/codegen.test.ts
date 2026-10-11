import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findLatestSpecFileName } from "./helpers/spec.js";

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
