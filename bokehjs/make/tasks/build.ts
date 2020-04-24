import {task} from "../task"

task("build", ["scripts:build", "styles:build", "compiler:build"])
task("build:all", ["build", "examples:build", "test:build"])

task("dev-build", ["scripts:dev-build", "styles:build"])
task("dev", ["dev-build"])
