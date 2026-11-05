import {task} from "../task.js"

export const build_scripts = task("scripts:build", ["lib:build"])

task("build", ["scripts:build", "compiler:build", "examples:build", "frameworks:build", "test:build"])
task("build:all", ["build"]) // backwards compatibility

task("dev", ["lib:build"])
