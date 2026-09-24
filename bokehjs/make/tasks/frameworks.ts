import cp from "node:child_process"
import {readFileSync} from "node:fs"

import {task, BuildError} from "../task.js"

type FrameworkPackage = {
  workspace: string
}

const packages = JSON.parse(readFileSync("npm_packages.json", "utf-8")) as FrameworkPackage[]

export const build_frameworks = task("frameworks:build", ["lib:build"], async () => {
  const is_windows = process.platform == "win32"
  const executable = is_windows ? "npx.cmd" : "npx"
  for (const {workspace} of packages) {
    if (workspace == "") {
      continue
    }
    const config = `${workspace}/tsconfig.json`
    const {status} = cp.spawnSync(executable, ["tsc", "-p", config], {stdio: "inherit", shell: is_windows})
    if (status != 0) {
      throw new BuildError("frameworks", `compilation failed for ${config}`)
    }
  }
})
