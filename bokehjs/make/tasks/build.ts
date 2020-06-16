import {task} from "../task"

task("build", ["scripts:build", "compiler:build"])
task("build:all", ["build", "examples:build", "test:build"])

task("dev", ["lib:build"])
