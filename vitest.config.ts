import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Several lib modules import "server-only" (a Next.js build-time guard
      // with no runtime behavior); stub it out so pure unit tests can load them.
      "server-only": path.resolve(__dirname, "./src/lib/__tests__/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
