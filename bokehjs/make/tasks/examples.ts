import * as fs from "fs"
import {join} from "path"
import {argv} from "yargs"

import {task, log} from "../task"
import {compileTypeScript} from "../compiler"

const BASE_DIR = "./examples"

for (const name of fs.readdirSync("./examples")) {
  const stats = fs.statSync(join(BASE_DIR, name))
  if (stats.isDirectory() && fs.existsSync(join(BASE_DIR, name, "tsconfig.json"))) {
    task(`examples:${name}`, async () => {
      compileTypeScript(join(BASE_DIR, name, "tsconfig.json"), {log})
    })
  }
}

const deps = argv.build === false ? [] : ["scripts:build", "styles:build"]

task("examples", [...deps], async () => {
  compileTypeScript(join(BASE_DIR, "tsconfig.json"), {log})
})
