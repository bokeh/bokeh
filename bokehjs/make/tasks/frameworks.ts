import cp from "node:child_process"

import {task, BuildError} from "../task.js"

const configs = [
  "frameworks/base/tsconfig.json",
  "frameworks/react/tsconfig.json",
  "frameworks/vue/tsconfig.json",
  "frameworks/svelte/tsconfig.json",
  "frameworks/web-component/tsconfig.json",
]

export const build_frameworks = task("frameworks:build", ["lib:build"], async () => {
  const executable = process.platform == "win32" ? "npx.cmd" : "npx"
  for (const config of configs) {
    const {status} = cp.spawnSync(executable, ["tsc", "-p", config], {stdio: "inherit"})
    if (status != 0) {
      throw new BuildError("frameworks", `compilation failed for ${config}`)
    }
  }
})
