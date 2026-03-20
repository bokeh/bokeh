import {task} from "../task.js"

export const build_scripts = task("scripts:build", ["lib:build"])

task("build", ["scripts:build", "compiler:build", "examples:build", "pack"])
task("build:all", ["build", "test:build"])

task("dev", ["lib:build"])
