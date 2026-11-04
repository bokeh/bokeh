import {join} from "node:path"
import cp from "node:child_process"
import {fileURLToPath} from "node:url"

import {argv} from "../args.js"
import {task, BuildError} from "../task.js"
import * as paths from "../paths.js"

task("oxlint", async () => {
  const dirs = [
    paths.make_dir,
    paths.src_dir.lib,
    paths.src_dir.compiler,
    paths.src_dir.server,
    paths.src_dir.test,
    paths.src_dir.examples,
    join(paths.base_dir, "frameworks"),
  ]

  const oxlint = fileURLToPath(new URL("./bin/oxlint", import.meta.resolve("oxlint/package.json")))
  const args = [oxlint, ...(argv.fix ? ["--fix"] : []), ...dirs]
  const {status, error} = cp.spawnSync(process.execPath, args, {stdio: "inherit", cwd: paths.base_dir})
  if (error != null) {
    throw new BuildError("oxlint", `failed to start oxlint: ${error.message}`)
  }
  if (status != 0) {
    throw new BuildError("oxlint", "lint failed")
  }
})

task("lint", ["oxlint"])
