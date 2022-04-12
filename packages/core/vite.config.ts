import { defineConfig } from "vite";
import path from "path";
import { builtinModules } from "module";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    copy({
      targets: [
        { src: "src/shell/scripts/set-system-proxy/clear.bat", dest: "dist/" },
        { src: "src/shell/scripts/set-system-proxy/sysproxy.exe", dest: "dist" }
      ],
      hook: "closeBundle",
      verbose: true
    })
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.js"),
      name: "fast-dev",
      fileName: format => `index.${format}.js`,
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: [...builtinModules, "axios"],
      output: {}
    }
  }
});
