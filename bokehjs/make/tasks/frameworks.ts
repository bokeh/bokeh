import cp from "node:child_process"

import {task, BuildError} from "../task.js"

const configs = [
  "frameworks/base/tsconfig.json",
  "frameworks/angular/tsconfig.json",
  "frameworks/react/tsconfig.json",
  "frameworks/vue/tsconfig.json",
  "frameworks/svelte/tsconfig.json",
  "frameworks/web-component/tsconfig.json",
]

export const build_frameworks = task("frameworks:build", ["lib:build"], async () => {
  const is_windows = process.platform == "win32"
  const executable = is_windows ? "npx.cmd" : "npx"
  for (const config of configs) {
    const compiler = config.includes("/angular/") ? "ngc" : "tsc"
    const {status} = cp.spawnSync(executable, [compiler, "-p", config], {stdio: "inherit", shell: is_windows})
    if (status != 0) {
      throw new BuildError("frameworks", `compilation failed for ${config}`)
    }
  }
})
