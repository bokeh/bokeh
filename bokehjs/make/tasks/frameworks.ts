import cp from "node:child_process"
import {readFileSync} from "node:fs"

import {task, BuildError} from "../task.js"
import {resolve_npx} from "#compiler/sys.js"

type FrameworkPackage = {
  workspace: string
}

const packages = JSON.parse(readFileSync("npm_packages.json", "utf-8")) as FrameworkPackage[]

export const build_frameworks = task("frameworks:build", ["lib:build"], async () => {
  for (const {workspace} of packages) {
    if (workspace == "") {
      continue
    }
    const config = `${workspace}/tsconfig.json`
    const [resolved_executable, resolved_args] = resolve_npx(["--loglevel=warn", "tsc", "-p", config])
    const {status, error} = cp.spawnSync(resolved_executable, resolved_args, {stdio: "inherit"})
    if (error != null) {
      throw new BuildError("frameworks", `failed to start tsc for ${config}: ${error.message}`)
    }
    if (status != 0) {
      throw new BuildError("frameworks", `compilation failed for ${config}`)
    }
  }
})
