import {join} from "node:path"

import {task} from "../task.js"
import {compile_typescript} from "./_util.js"

task("examples:compile", async () => {
  compile_typescript(join("examples", "tsconfig.json"))
})

task("examples:build", ["examples:compile"])

task("examples", ["lib:build", "examples:build"])
