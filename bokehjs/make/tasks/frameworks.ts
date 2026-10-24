import {readFileSync} from "node:fs"

import {task} from "../task.js"
import {compile_typescript} from "./_util.js"

type FrameworkPackage = {
  workspace: string
}

const packages = JSON.parse(readFileSync("npm_packages.json", "utf-8")) as FrameworkPackage[]

export const build_frameworks = task("frameworks:build", ["lib:build"], async () => {
  for (const {workspace} of packages) {
    if (workspace == "") {
      continue
    }
    compile_typescript(`${workspace}/tsconfig.json`)
  }
})
