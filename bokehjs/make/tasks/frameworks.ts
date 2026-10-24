import {readFileSync} from "node:fs"

import {task} from "../task.js"
import {compile_typescript} from "./_util.js"

type FrameworkPackage = {
  workspace: string
}

const packages = JSON.parse(readFileSync("npm_packages.json", "utf-8")) as FrameworkPackage[]

task("frameworks:compile", ["scripts:compile"], async () => {
  for (const {workspace} of packages) {
    if (workspace == "") {
      continue
    }
    const config = `${workspace}/tsconfig.json`
    compile_typescript(config)
  }
})

export const build_frameworks = task("frameworks:build", ["lib:build", "frameworks:compile"])
