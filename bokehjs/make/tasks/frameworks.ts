import cp from "node:child_process"
import {readFileSync} from "node:fs"

import {task, BuildError} from "../task.js"

type FrameworkPackage = {
  workspace: string
  compiler?: "tsc" | "ngc"
}

const packages = JSON.parse(readFileSync("npm_packages.json", "utf-8")) as FrameworkPackage[]

export const build_frameworks = task("frameworks:build", ["lib:build"], async () => {
  const is_windows = process.platform == "win32"
  const executable = is_windows ? "npx.cmd" : "npx"
  for (const {workspace, compiler} of packages) {
    if (compiler == null) {
      continue
    }
    const config = `${workspace}/tsconfig.json`
    const {status} = cp.spawnSync(executable, [compiler, "-p", config], {stdio: "inherit", shell: is_windows})
    if (status != 0) {
      throw new BuildError("frameworks", `compilation failed for ${config}`)
    }
  }
})
