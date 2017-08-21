import * as fs from "fs"
import {join} from "path"
import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as ts from 'gulp-typescript'
import * as run from 'run-sequence'
import {argv} from "yargs"

const BASE_DIR = "./examples"

const reporter = ts.reporter.nullReporter()

const compile = (name: string) => {
  const project = ts.createProject(join(BASE_DIR, name, "tsconfig.json"), {
    typescript: require('typescript')
  })
  return project.src()
   .pipe(project(reporter).on('error', (err: {message: string}) => gutil.log(err.message)))
   .pipe(gulp.dest(join(BASE_DIR, name)))
}

const examples: string[] = []

for(const name of fs.readdirSync("./examples")) {
  const stats = fs.statSync(join(BASE_DIR, name))
  if (stats.isDirectory() && fs.existsSync(join(BASE_DIR, name, "tsconfig.json"))) {
    examples.push(name)
    gulp.task(`examples:${name}`, () => compile(name))
  }
}

const deps = argv.build === false ? [] : ["scripts:build", "styles:build"]

gulp.task("examples", deps, (cb: (arg?: any) => void) => {
  run(examples.map((example) => `examples:${example}`), cb)
})
