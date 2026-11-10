import fs from "node:fs"
import {join, basename} from "node:path"

import * as esbuild from "esbuild"

import {task, passthrough} from "../task.js"
import {src_dir, build_dir} from "../paths.js"
import {compile_typescript} from "./_util.js"

task("compiler:ts", async () => {
  compile_typescript(join(src_dir.compiler, "tsconfig.json"))
})

/**
 * oxc's packages load platform-specific native bindings, which can't be bundled.
 * Use oxc's WASI bindings instead, with `*.wasm` embedded in the bundle, so that
 * `compiler.mjs` remains a single, platform-independent file.
 */
const oxc_wasi: esbuild.Plugin = {
  name: "oxc-wasi",
  setup(build) {
    const loaders = [
      {filter: /[\\/]node_modules[\\/]oxc-parser[\\/]src-js[\\/]bindings\.js$/, binding: "@oxc-parser/binding-wasm32-wasip1"},
      {filter: /[\\/]node_modules[\\/]oxc-minify[\\/]index\.js$/, binding: "@oxc-minify/binding-wasm32-wasip1"},
      {filter: /[\\/]node_modules[\\/]oxc-transform[\\/]index\.js$/, binding: "@oxc-transform/binding-wasm32-wasip1"},
    ]
    for (const {filter, binding} of loaders) {
      build.onLoad({filter}, () => ({contents: `export * from "${binding}"`, loader: "js"}))
    }

    build.onLoad({filter: /[\\/]node_modules[\\/]@oxc-[a-z]+[\\/]binding-wasm32-wasip1[\\/][a-z]+\.wasip1\.cjs$/}, async ({path}) => {
      const source = await fs.promises.readFile(path, "utf8")
      // The binding resolves `*.wasm` relative to `__dirname` and reads it with `fs.readFileSync()`.
      const wasm_lookup = /let __wasmFilePath = [^]*?const __wasmFile = __nodeFs\.readFileSync\(__wasmFilePath\)\n/
      if (!wasm_lookup.test(source)) {
        throw new Error(`unsupported layout of ${path}`)
      }
      const wasm = `./${basename(path, ".wasip1.cjs")}.wasm32-wasip1.wasm`
      return {contents: source.replace(wasm_lookup, `const __wasmFile = require(${JSON.stringify(wasm)})\n`), loader: "js"}
    })
  },
}

task("compiler:build", [passthrough("compiler:ts")], async () => {
  const entries = [join(build_dir.compiler, "main.js")]
  const outfile = join(build_dir.js, "compiler.mjs")

  await esbuild.build({
    entryPoints: entries,
    outfile,
    platform: "node",
    target: "node22",
    format: "esm",
    bundle: true,
    minify: true,
    treeShaking: true,
    sourcemap: true,
    loader: {".wasm": "binary"},
    banner: {
      js: [
        // bundled CommonJS modules use `require()`, `__filename` and `__dirname`
        "import {createRequire as __createRequire} from \"node:module\";",
        "import {fileURLToPath as __fileURLToPath} from \"node:url\";",
        "import {dirname as __pathDirname} from \"node:path\";",
        "const require = __createRequire(import.meta.url);",
        "const __filename = __fileURLToPath(import.meta.url);",
        "const __dirname = __pathDirname(__filename);",
        // silence `ExperimentalWarning: WASI is an experimental feature` from oxc's bindings
        "const __emit_warning = process.emitWarning;",
        "process.emitWarning = function(warning, ...args) { if (!String(warning).startsWith(\"WASI \")) __emit_warning.call(this, warning, ...args) };",
      ].join("\n"),
    },
    plugins: [oxc_wasi],
  })
})
