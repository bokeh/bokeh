import * as fs from "fs"
import {join} from "path"

import {task} from "../task"
import {compile_typescript} from "@compiler/compiler"

const BASE_DIR = "./examples"

for (const name of fs.readdirSync("./examples")) {
  const stats = fs.statSync(join(BASE_DIR, name))
  if (stats.isDirectory() && fs.existsSync(join(BASE_DIR, name, "tsconfig.json"))) {
    task(`examples:${name}`, async () => {
      compile_typescript(join(BASE_DIR, name, "tsconfig.json"))
    })
  }
}

task("examples:compile", async () => {
  compile_typescript(join(BASE_DIR, "tsconfig.json"))
})

task("examples:build", ["examples:compile"])

task("examples", ["lib:build", "examples:build"])
