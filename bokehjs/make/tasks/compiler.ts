import cp from "node:child_process"
import {join} from "node:path"

import * as esbuild from "esbuild"

import {task, BuildError, passthrough} from "../task.js"
import {src_dir, build_dir} from "../paths.js"
import {resolve_npx} from "#compiler/sys.js"

task("compiler:ts", async () => {
  const config = join(src_dir.compiler, "tsconfig.json")
  const [resolved_executable, resolved_args] = resolve_npx(["--loglevel=warn", "tsc", "--project", config])
  const {status, error} = cp.spawnSync(resolved_executable, resolved_args, {stdio: "inherit"})
  if (error != null) {
    throw new BuildError("typescript", `failed to start tsc: ${error.message}`)
  }
  if (status !== 0) {
    throw new BuildError("typescript", "compilation of *.ts and *.tsx files failed")
  }
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
