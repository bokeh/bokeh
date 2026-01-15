import cp from "node:child_process"
import {join} from "node:path"

import * as esbuild from "esbuild"

import {task, BuildError, passthrough} from "../task.js"
import {src_dir, build_dir} from "../paths.js"

task("compiler:ts", async () => {
  const is_windows = process.platform == "win32"
  const npx = is_windows ? "npx.cmd" : "npx"
  const {status} = cp.spawnSync(npx, ["tsc", "--project", join(src_dir.compiler, "tsconfig.json")], {stdio: "inherit", shell: is_windows})
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
