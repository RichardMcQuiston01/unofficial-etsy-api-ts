/**
 * Stage 2 (Codegen) — turns docs/<version>.json (Etsy's OpenAPI v3 spec)
 * into the generated type layer under src/generated/. See
 * docs/ARCHITECTURE.md "Package entry shape" / "Core types" for the
 * contract this script fulfills.
 *
 * Usage: npm run codegen
 *
 * Picks the highest-semver docs/<X.Y.Z>.json present, so bumping to a new
 * Etsy spec version is a drop-in replace of that file followed by a rerun.
 * Only ever writes to src/generated/** — nothing else.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { format, resolveConfig } from "prettier";
import openapiTS, { astToString } from "openapi-typescript";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = join(rootDir, "docs");
const generatedDir = join(rootDir, "src", "generated");

interface OpenApiParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
}

interface OpenApiOperation {
  operationId: string;
  parameters?: OpenApiParameter[];
  requestBody?: { content: Record<string, unknown> };
  responses: Record<string, { content?: Record<string, unknown> }>;
}

interface OpenApiSpec {
  info: { version: string };
  paths: Record<string, Record<string, OpenApiOperation>>;
  components: { schemas: Record<string, unknown> };
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"] as const;

function parseSemver(fileName: string): [number, number, number] {
  const [major, minor, patch] = fileName.replace(".json", "").split(".").map(Number);
  return [major ?? 0, minor ?? 0, patch ?? 0];
}

function findLatestSpecFile(): string {
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
  return join(docsDir, latest);
}

function toPascalCase(operationId: string): string {
  return operationId.charAt(0).toUpperCase() + operationId.slice(1);
}

/** Collects every (method, path, operation) triple, sorted by operationId for a stable diff. */
function collectOperations(spec: OpenApiSpec) {
  const operations: { method: string; path: string; op: OpenApiOperation }[] = [];
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const op = pathItem[method];
      if (op) operations.push({ method, path, op });
    }
  }
  operations.sort((a, b) => a.op.operationId.localeCompare(b.op.operationId));
  return operations;
}

function generateSchemasSource(spec: OpenApiSpec): string {
  const schemaNames = Object.keys(spec.components.schemas).sort((a, b) => a.localeCompare(b));
  const lines = schemaNames.map(
    (name) => `export type ${name} = components["schemas"]["${name}"];`,
  );
  return [
    banner(spec, "src/generated/schemas.ts"),
    `import type { components } from "./openapi.js";`,
    "",
    `// ${schemaNames.length} schemas from the OpenAPI spec's components.schemas.`,
    ...lines,
    "",
  ].join("\n");
}

function generateOperationsSource(spec: OpenApiSpec): string {
  const operations = collectOperations(spec);
  const blocks = operations.map(({ op }) => {
    const pascal = toPascalCase(op.operationId);
    const lines: string[] = [];

    if (op.parameters && op.parameters.length > 0) {
      lines.push(`export type ${pascal}Params = operations["${op.operationId}"]["parameters"];`);
    }

    if (op.requestBody) {
      const contentTypes = Object.keys(op.requestBody.content);
      const [contentType] = contentTypes;
      if (contentTypes.length !== 1 || !contentType) {
        throw new Error(
          `${op.operationId}: expected exactly one requestBody content type, found [${contentTypes.join(", ")}]`,
        );
      }
      lines.push(
        `export type ${pascal}RequestBody = NonNullable<operations["${op.operationId}"]["requestBody"]>["content"]["${contentType}"];`,
      );
    }

    const successEntries = Object.entries(op.responses).filter(([code]) => code.startsWith("2"));
    if (successEntries.length !== 1) {
      throw new Error(
        `${op.operationId}: expected exactly one 2xx response, found [${successEntries.map(([c]) => c).join(", ")}]`,
      );
    }
    const [successCode, successResponse] = successEntries[0]!;
    if (successResponse.content) {
      const contentTypes = Object.keys(successResponse.content);
      const [contentType] = contentTypes;
      if (contentTypes.length !== 1 || !contentType) {
        throw new Error(
          `${op.operationId}: expected exactly one ${successCode} response content type, found [${contentTypes.join(", ")}]`,
        );
      }
      lines.push(
        `export type ${pascal}Response = operations["${op.operationId}"]["responses"]["${successCode}"]["content"]["${contentType}"];`,
      );
    } else {
      lines.push(`export type ${pascal}Response = void; // ${successCode} No Content`);
    }

    return lines.join("\n");
  });

  return [
    banner(spec, "src/generated/operations.ts"),
    `import type { operations } from "./openapi.js";`,
    "",
    `// ${operations.length} operations, keyed by operationId.`,
    ...blocks,
    "",
  ].join("\n\n");
}

function banner(spec: OpenApiSpec, relativePath: string): string {
  return [
    "/**",
    ` * AUTO-GENERATED from docs/${spec.info.version}.json by scripts/codegen.ts.`,
    ` * Do not edit ${relativePath.split("/").pop()} by hand — rerun \`npm run codegen\`.`,
    " */",
    "",
  ].join("\n");
}

async function writeFormatted(path: string, source: string): Promise<void> {
  const prettierConfig = (await resolveConfig(path)) ?? {};
  const formatted = await format(source, { ...prettierConfig, filepath: path });
  writeFileSync(path, formatted);
}

async function main(): Promise<void> {
  const specPath = findLatestSpecFile();
  console.log(`Using spec: ${specPath}`);

  const spec = JSON.parse(readFileSync(specPath, "utf-8")) as OpenApiSpec;

  const ast = await openapiTS(pathToFileURL(specPath));
  const rawTypes = astToString(ast);
  const openapiSource = [banner(spec, "src/generated/openapi.ts"), rawTypes].join("\n");

  await writeFormatted(join(generatedDir, "openapi.ts"), openapiSource);
  await writeFormatted(join(generatedDir, "schemas.ts"), generateSchemasSource(spec));
  await writeFormatted(join(generatedDir, "operations.ts"), generateOperationsSource(spec));

  console.log(`Wrote schemas.ts, operations.ts, and openapi.ts to ${generatedDir}`);
}

await main();
