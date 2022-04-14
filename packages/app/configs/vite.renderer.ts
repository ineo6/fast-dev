import { join } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import styleImport from "vite-plugin-style-import";
import { builtinModules } from "module";
import commonjsExternals from "vite-plugin-commonjs-externals";
import svgrPlugin from "vite-plugin-svgr";

export default defineConfig({
  mode: process.env.NODE_ENV,
  root: join(__dirname, "../src/renderer"),
  resolve: {
    mainFields: ["module", "main"]
  },
  optimizeDeps: {
    exclude: builtinModules
  },
  base: "./",
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },
  plugins: [
    svgrPlugin({
      svgrOptions: {
        icon: true
      }
    }),
    react(),
    styleImport({
      libs: [
        {
          libraryName: "antd",
          esModule: true,
          resolveStyle: name => {
            return `antd/es/${name}/style/index`;
          }
        }
      ]
    }),
    commonjsExternals({
      externals: ["path", /^electron(\/.+)?$/]
    })
  ],
  build: {
    emptyOutDir: true,
    outDir: "../../dist/renderer",
    rollupOptions: {
      external: [...builtinModules, "electron"]
    }
  }
});
