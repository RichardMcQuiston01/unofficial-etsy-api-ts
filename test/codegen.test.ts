import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readGenerated(fileName: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../src/generated/${fileName}`, import.meta.url)),
    "utf-8",
  );
}

function readSpec(): {
  paths: Record<string, Record<string, { operationId: string }>>;
  components: { schemas: Record<string, unknown> };
} {
  const raw = readFileSync(fileURLToPath(new URL("../docs/3.0.0.json", import.meta.url)), "utf-8");
  return JSON.parse(raw) as ReturnType<typeof readSpec>;
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

describe("generated code (src/generated/**), from docs/3.0.0.json", () => {
  const spec = readSpec();
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

  it("is idempotent: every generated file carries the AUTO-GENERATED banner", () => {
    for (const source of [schemasSource, operationsSource, readGenerated("openapi.ts")]) {
      expect(source).toMatch(/AUTO-GENERATED from docs\/3\.0\.0\.json by scripts\/codegen\.ts/);
    }
  });
});
