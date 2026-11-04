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
  const outfile = join(build_dir.js, "compiler.js")

  await esbuild.build({
    entryPoints: entries,
    outfile,
    platform: "node",
    bundle: true,
    minify: true,
    treeShaking: true,
    sourcemap: true,
  })
})
