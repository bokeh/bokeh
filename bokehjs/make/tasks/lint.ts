import {join} from "node:path"
import cp from "node:child_process"
import {fileURLToPath} from "node:url"

import {argv} from "../args.js"
import {task, BuildError} from "../task.js"
import * as paths from "../paths.js"

function oxlint(dirs: string[]): void {
  const oxlint = fileURLToPath(new URL("./bin/oxlint", import.meta.resolve("oxlint/package.json")))
  const args = [oxlint, ...(argv.fix ? ["--fix"] : []), ...dirs]
  const {status, error} = cp.spawnSync(process.execPath, args, {stdio: "inherit", cwd: paths.base_dir})
  if (error != null) {
    throw new BuildError("oxlint", `failed to start oxlint: ${error.message}`)
  }
  if (status != 0) {
    throw new BuildError("oxlint", "lint failed")
  }
}

const dirs = {
  make: paths.make_dir,
  lib: paths.src_dir.lib,
  compiler: paths.src_dir.compiler,
  server: paths.src_dir.server,
  test: paths.src_dir.test,
  examples: paths.src_dir.examples,
  frameworks: join(paths.base_dir, "frameworks"),
}

for (const [name, dir] of Object.entries(dirs)) {
  task(`oxlint:${name}`, async () => oxlint([dir]))
}

task("oxlint", async () => oxlint(Object.values(dirs)))
task("lint", ["oxlint"])
