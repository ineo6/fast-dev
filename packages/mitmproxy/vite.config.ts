import { defineConfig } from "vite";
import path from "path";
import { builtinModules } from "module";

export default defineConfig({
  resolve: {},
  build: {
    target: "node12",
    lib: {
      entry: path.resolve(__dirname, "src/index"),
      name: "mitmproxy",
      fileName: format => `index.${format}.js`,
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: [...builtinModules, "axios", "is-browser"],
      output: {}
    }
  }
});
