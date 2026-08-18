import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const packageJsonPath = fileURLToPath(new URL("../package.json", import.meta.url));
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
  name: string;
  version: string;
  license: string;
  type: string;
  main: string;
  module: string;
  types: string;
  engines: { node: string };
  exports: Record<string, unknown>;
};

describe("package.json", () => {
  it("declares the scoped package name from the README", () => {
    expect(packageJson.name).toBe("@richardmcquiston01/etsy-api");
  });

  it("uses Apache-2.0, matching LICENSE", () => {
    expect(packageJson.license).toBe("Apache-2.0");
  });

  it("declares dual ESM/CJS entry points consistent with its exports map", () => {
    expect(packageJson.type).toBe("module");
    expect(packageJson.main).toBe("./dist/index.cjs");
    expect(packageJson.module).toBe("./dist/index.js");
    expect(packageJson.types).toBe("./dist/index.d.ts");

    const rootExport = packageJson.exports["."] as Record<string, string>;
    expect(rootExport.require).toBe(packageJson.main);
    expect(rootExport.import).toBe(packageJson.module);
    expect(rootExport.types).toBe(packageJson.types);
  });

  it("requires Node 20+, per docs/ARCHITECTURE.md's locked runtime support", () => {
    expect(packageJson.engines.node).toBe(">=20");
  });

  it("is valid semver on the 0.1.x line (no prerelease/build metadata, no leading zeros)", () => {
    expect(packageJson.version).toMatch(/^0\.1\.(0|[1-9]\d*)$/);
  });
});
