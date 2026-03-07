import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

const nodeBuiltins = [
  "fs",
  "path",
  "stream/promises",
  "stream",
  "readline",
  "url",
  "util",
  "os",
  "crypto",
  "child_process",
  "events",
  "buffer",
  "process",
  "assert",
  "timers",
  "tty",
  "zlib",
  "http",
  "https",
  "net",
  "dns",
  "cluster",
  "worker_threads",
];

const externalPkgs = [
  "chalk",
  "cli-table3",
  "cli-progress",
  "cli-spinners",
  "ora",
];

export default defineConfig({
  resolve: {
    alias: {
      "@grab-url/log": resolve(__dirname, "packages/log-json/log-json.ts"),
      "@grab-url/grab-api": resolve(__dirname, "packages/grab-api/index.ts"),
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ["packages/**/*.ts"],
      outDir: "dist",
      rollupTypes: true,
    }),
  ],
  build: {
    target: "es2022",
    lib: {
      entry: {
        "grab-api": resolve(__dirname, "packages/grab-api/index.ts"),
        icons: resolve(__dirname, "packages/loading-animations/svg/index.ts"),
        log: resolve(__dirname, "packages/log-json/log-json.ts"),
        "grab-url-cli": resolve(__dirname, "packages/grab-url-cli/index.ts"),
        "archiver-web": resolve(
          __dirname,
          "packages/archiver-web/src/index.ts",
        ),
        "bin-extract": resolve(
          __dirname,
          "packages/archiver-web/src/bin-extract.ts",
        ),
        "bin-compress": resolve(
          __dirname,
          "packages/archiver-web/src/bin-compress.ts",
        ),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format}.js`,
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: false,
        banner: (chunk) => {
          if (chunk.name.startsWith("bin-") || chunk.name === "grab-url-cli") {
            return "#!/usr/bin/env node\n";
          }
          return "";
        },
      },
      external: (id) => {
        if (id.startsWith("node:") || nodeBuiltins.includes(id)) return true;
        if (externalPkgs.includes(id)) return true;
        if (id === "libarchive.js" || id.startsWith("libarchive.js/"))
          return true;
        // Externalize internal package references
        if (id.startsWith("@grab-url/")) return true;
        return false;
      },
    },
    minify: "terser",
    sourcemap: true,
    emptyOutDir: true,
  },
});
