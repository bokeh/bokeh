gulp = require "gulp"
gutil = require "gulp-util"
ts = require 'gulp-typescript'
run = require 'run-sequence'

reporter = ts.reporter.nullReporter()

compile = (name) ->
  project = ts.createProject("./examples/#{name}/tsconfig.json")
  project.src()
         .pipe(ts(project, {}, reporter).on('error', (err) -> gutil.log(err.message)))
         .js
         .pipe(gulp.dest("./"))

examples = ["anscombe", "burtin", "charts", "donut", "hover", "legends", "linked", "tap", "stocks"]

for example in examples
  do (example) ->
    gulp.task "examples:#{example}", () -> compile(example)

gulp.task "examples", ["scripts:build", "styles:build"], (cb) ->
  run(("examples:#{example}" for example in examples), cb)
