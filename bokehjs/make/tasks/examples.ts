import * as fs from "fs"
import {join} from "path"
import {argv} from "yargs"

import {task, log} from "../task"
import {compileTypeScript} from "../compiler"

const BASE_DIR = "./examples"

const compile = (name: string) => {
  compileTypeScript(join(BASE_DIR, name, "tsconfig.json"), {log})
}

const examples: string[] = []

for(const name of fs.readdirSync("./examples")) {
  const stats = fs.statSync(join(BASE_DIR, name))
  if (stats.isDirectory() && fs.existsSync(join(BASE_DIR, name, "tsconfig.json"))) {
    examples.push(name)
    task(`examples:${name}`, async () => { compile(name) })
  }
}

const deps = argv.build === false ? [] : ["scripts:build", "styles:build"]
const tasks = examples.map((example) => `examples:${example}`)

task("examples", [...deps, ...tasks])
