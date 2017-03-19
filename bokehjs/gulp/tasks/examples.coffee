fs = require "fs"
{join} = require "path"
gulp = require "gulp"
gutil = require "gulp-util"
ts = require 'gulp-typescript'
run = require 'run-sequence'
argv = require("yargs").argv

BASE_DIR = "./examples"

reporter = ts.reporter.nullReporter()

compile = (name) ->
  project = ts.createProject(join(BASE_DIR, name, "tsconfig.json"), {
    typescript: require('typescript')
  })
  project.src()
         .pipe(project(reporter).on('error', (err) -> gutil.log(err.message)))
         .pipe(gulp.dest(join(BASE_DIR, name)))

examples = []

for name in fs.readdirSync("./examples")
  do (name) ->
    stats = fs.statSync(join(BASE_DIR, name))
    if stats.isDirectory() and fs.existsSync(join(BASE_DIR, name, "tsconfig.json"))
      examples.push(name)
      gulp.task("examples:#{name}", () -> compile(name))

deps = if argv.build == false then [] else ["scripts:build", "styles:build"]

gulp.task "examples", deps, (cb) ->
  run(("examples:#{example}" for example in examples), cb)
