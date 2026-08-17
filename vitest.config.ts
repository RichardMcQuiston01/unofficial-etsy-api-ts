import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/generated/**"],
      // Per docs/ARCHITECTURE.md's coverage target: >=90% on src/ overall,
      // 100% on the transport/auth layers specifically. `npm run test:coverage`
      // fails the build below these — see .github/workflows/ci.yml.
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 90,
        "src/http/**": { lines: 100, statements: 100, functions: 100, branches: 100 },
        "src/auth/**": { lines: 100, statements: 100, functions: 100, branches: 100 },
      },
    },
  },
});
