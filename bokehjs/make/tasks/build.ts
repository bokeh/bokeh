import {task} from "../task"

task("build", ["scripts", "styles", "compiler:build"])

task("build:stripped", ["scripts", "styles", "compiler:build", "scripts:strip"])

task("dev-build", ["scripts:dev-build", "styles:build"])
task("dev", ["dev-build"])
