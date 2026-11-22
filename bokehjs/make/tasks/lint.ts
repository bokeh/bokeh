import cp from "node:child_process"
import {fileURLToPath} from "node:url"

import {argv} from "../args.js"
import {task, BuildError} from "../task.js"
import * as paths from "../paths.js"

task("lint:scripts", async () => {
  const oxlint = fileURLToPath(new URL("./bin/oxlint", import.meta.resolve("oxlint/package.json")))
  const args = [oxlint, ...(argv.fix ? ["--fix"] : []), "."]
  const {status, error} = cp.spawnSync(process.execPath, args, {stdio: "inherit", cwd: paths.base_dir})
  if (error != null) {
    throw new BuildError("lint:scripts", `failed to start oxlint: ${error.message}`)
  }
  if (status != 0) {
    throw new BuildError("lint:scripts", "lint failed")
  }
})

task("lint:styles", async () => {
  const stylelint = fileURLToPath(new URL("./bin/stylelint.mjs", import.meta.resolve("stylelint/package.json")))
  const args = [stylelint, ...(argv.fix ? ["--fix"] : []), "src/less/**/*.less"]
  const {status, error} = cp.spawnSync(process.execPath, args, {stdio: "inherit", cwd: paths.base_dir})
  if (error != null) {
    throw new BuildError("lint:styles", `failed to start stylelint: ${error.message}`)
  }
  if (status != 0) {
    throw new BuildError("lint:styles", "lint failed")
  }
})

task("lint", ["lint:scripts", "lint:styles"])
