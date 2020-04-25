import {task} from "../task"

task("build", ["scripts:build", "compiler:build"])
task("dev", ["lib:build"])
