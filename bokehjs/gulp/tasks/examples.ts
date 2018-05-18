import * as fs from "fs"
import {join} from "path"
import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as run from 'run-sequence'
import {argv} from "yargs"

import {compileTypeScript} from "../compiler"

const BASE_DIR = "./examples"

const compile = (name: string) => {
  compileTypeScript(join(BASE_DIR, name, "tsconfig.json"), {log: gutil.log})
}

const examples: string[] = []

for(const name of fs.readdirSync("./examples")) {
  const stats = fs.statSync(join(BASE_DIR, name))
  if (stats.isDirectory() && fs.existsSync(join(BASE_DIR, name, "tsconfig.json"))) {
    examples.push(name)
    gulp.task(`examples:${name}`, (next: () => void) => { compile(name); next(); })
  }
}

const deps = argv.build === false ? [] : ["scripts:build", "styles:build"]

gulp.task("examples", deps, (cb: (arg?: any) => void) => {
  run(examples.map((example) => `examples:${example}`), cb)
})
