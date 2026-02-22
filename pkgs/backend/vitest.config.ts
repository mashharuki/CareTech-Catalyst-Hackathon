import { defineConfig } from "vitest/config";

export default defineConfig({
  mode: "node",
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    extensions: [".ts", ".js"],
    conditions: ["import", "node", "default"],
  },
});

