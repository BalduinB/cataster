import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    /* Only treat files under `test/` as test files. `confect/health.spec.ts`
     * (and its siblings) are Confect *function specs*, not vitest specs. */
    include: ["test/**/*.test.ts"],
    /* `convex-test` (which `@confect/test` wraps) requires the `edge-runtime`
     * environment to emulate Convex's V8 isolate. */
    environment: "edge-runtime",
    server: {
      deps: {
        /* Inline Effect packages so vitest can transform their ESM correctly
         * inside the edge-runtime worker. */
        inline: ["effect", /^@effect\//, /^@confect\//],
      },
    },
  },
});
