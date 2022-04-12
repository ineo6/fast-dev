import { defineConfig } from "vite";
import path from "path";
import { builtinModules } from "module";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index"),
      name: "fast-ip",
      fileName: (format: any) => `index.${format}.js`,
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      external: [...builtinModules],
      output: {}
    }
  }
});
