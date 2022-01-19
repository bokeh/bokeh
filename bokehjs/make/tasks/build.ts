import {task} from "../task"

task("build", ["scripts:build", "compiler:build"])
task("build:all", ["build", "test:build", "examples:build"])

task("dev", ["lib:build"])
