import {task} from "../task.js"

task("build", ["scripts:build", "compiler:build", "examples:build", "pack"])
task("build:all", ["build", "test:build"])

task("dev", ["lib:build"])
