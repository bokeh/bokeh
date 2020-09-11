import {join} from "path"

import {task} from "../task"
import {compile_typescript} from "@compiler/compiler"

task("examples:compile", async () => {
  compile_typescript(join("examples", "tsconfig.json"))
})

task("examples:build", ["examples:compile"])

task("examples", ["lib:build", "examples:build"])
