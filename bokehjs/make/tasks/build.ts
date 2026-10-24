import {task} from "../task.js"
import {compile_typescript} from "./_util.js"

task("build:typecheck", async () => compile_typescript("./make/tsconfig.json"))

export const build_scripts = task("scripts:build", ["lib:build"])

task("build", ["build:typecheck", "scripts:build", "compiler:build", "examples:build", "frameworks:build"])
task("build:all", ["build", "test:build"])

task("dev", ["lib:build"])
