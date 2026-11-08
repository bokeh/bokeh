import {join} from "node:path"

import * as esbuild from "esbuild"

import {task, passthrough} from "../task.js"
import {src_dir, build_dir} from "../paths.js"
import {compile_typescript} from "./_util.js"

task("compiler:ts", async () => {
  compile_typescript(join(src_dir.compiler, "tsconfig.json"))
})

task("compiler:build", [passthrough("compiler:ts")], async () => {
  const entries = [join(build_dir.compiler, "main.js")]
  const outfile = join(build_dir.js, "compiler.mjs")

  await esbuild.build({
    entryPoints: entries,
    outfile,
    platform: "node",
    format: "esm",
    bundle: true,
    minify: true,
    treeShaking: true,
    sourcemap: true,
    banner: {
      js: [
        // bundled CommonJS modules use `require()`, `__filename` and `__dirname`
        "import {createRequire as __createRequire} from \"node:module\";",
        "import {fileURLToPath as __fileURLToPath} from \"node:url\";",
        "import {dirname as __pathDirname} from \"node:path\";",
        "const require = __createRequire(import.meta.url);",
        "const __filename = __fileURLToPath(import.meta.url);",
        "const __dirname = __pathDirname(__filename);",
      ].join("\n"),
    },
  })
})
