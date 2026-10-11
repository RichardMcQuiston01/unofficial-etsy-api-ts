import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { docsDir, findLatestSpecFileName } from "./helpers/spec.js";

interface SpecOperation {
  operationId: string;
  security?: Record<string, unknown>[];
  requestBody?: { content: Record<string, unknown> };
}

interface ExpectedOperation {
  method: string;
  path: string;
  auth: "apiKey" | "oauth";
  bodyKind: "json" | "form" | "multipart" | undefined;
}

interface ImplementedOperation extends ExpectedOperation {
  file: string;
}

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
const BODY_KIND_BY_CONTENT_TYPE: Record<string, ExpectedOperation["bodyKind"]> = {
  "application/json": "json",
  "application/x-www-form-urlencoded": "form",
  "multipart/form-data": "multipart",
};

function loadSpecOperations(): Map<string, ExpectedOperation> {
  const spec = JSON.parse(readFileSync(`${docsDir}/${findLatestSpecFileName()}`, "utf-8")) as {
    paths: Record<string, Record<string, SpecOperation>>;
  };

  const operations = new Map<string, ExpectedOperation>();
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;
      const contentTypes = Object.keys(operation.requestBody?.content ?? {});
      operations.set(operation.operationId, {
        method: method.toUpperCase(),
        path,
        auth: operation.security?.some((scheme) => "oauth2" in scheme) ? "oauth" : "apiKey",
        bodyKind: contentTypes[0] ? BODY_KIND_BY_CONTENT_TYPE[contentTypes[0]] : undefined,
      });
    }
  }
  return operations;
}

function listSourceFiles(directory: URL): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) return listSourceFiles(child);
    return entry.name.endsWith(".ts") ? [fileURLToPath(child)] : [];
  });
}

/** Extracts every `this.#http.request({...})` call, resolving `*_PATH` constants. */
function loadImplementedOperations(): Map<string, ImplementedOperation> {
  const resourcesDir = new URL("../src/resources/", import.meta.url);
  const implemented = new Map<string, ImplementedOperation>();

  for (const file of listSourceFiles(resourcesDir)) {
    const source = readFileSync(file, "utf-8");
    const constants = new Map<string, string>();
    for (const match of source.matchAll(/const (\w+) =\s*"([^"]+)";/g)) {
      constants.set(match[1] as string, match[2] as string);
    }

    const callPattern =
      /method:\s*"(\w+)",\s*path:\s*("([^"]+)"|(\w+)),([\s\S]*?)operationId:\s*"(\w+)"/g;
    for (const match of source.matchAll(callPattern)) {
      const [, method, , literalPath, constantName, middle, operationId] = match;
      const path = literalPath ?? constants.get(constantName as string);
      if (path === undefined) throw new Error(`${file}: unresolved path constant ${constantName}`);
      const auth = /auth:\s*"(apiKey|oauth)"/.exec(middle as string)?.[1] as "apiKey" | "oauth";
      const bodyKind = /kind:\s*"(json|form|multipart)"/.exec(
        middle as string,
      )?.[1] as ExpectedOperation["bodyKind"];
      implemented.set(operationId as string, {
        method: method as string,
        path,
        auth,
        bodyKind,
        file,
      });
    }
  }
  return implemented;
}

describe(`OpenAPI drift: src/resources vs docs/${findLatestSpecFileName()}`, () => {
  const expected = loadSpecOperations();
  const implemented = loadImplementedOperations();

  it("implements exactly the operations in the spec", () => {
    expect([...implemented.keys()].sort()).toEqual([...expected.keys()].sort());
  });

  it.each([...expected.entries()])("%s matches the spec", (operationId, spec) => {
    const actual = implemented.get(operationId);
    expect(actual, `no resource method for ${operationId}`).toBeDefined();
    const { file: _file, ...comparable } = actual as ImplementedOperation;
    expect(comparable, `${operationId} in ${actual?.file}`).toEqual(spec);
  });
});
