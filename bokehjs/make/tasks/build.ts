import {task} from "../task"

task("build", ["scripts", "styles", "compiler:build"])

task("dev-build", ["scripts:dev-build", "styles:build"])
task("dev", ["dev-build"])
