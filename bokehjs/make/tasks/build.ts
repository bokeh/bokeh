import {task} from "../task"

task("build", ["scripts:build", "compiler:build", "examples:build"])
task("build:all", ["build", "test:build"])

task("dev", ["lib:build"])
