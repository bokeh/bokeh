gulp = require "gulp"
gutil = require "gulp-util"
ts = require 'gulp-typescript'

reporter = ts.reporter.nullReporter()

compile = (name) ->
  project = ts.createProject("./examples/#{name}/tsconfig.json")
  project.src()
         .pipe(ts(project, {}, reporter).on('error', (err) -> gutil.log(err.message)))
         .js
         .pipe(gulp.dest("./"))

gulp.task "examples:anscombe", () -> compile("anscombe")
gulp.task "examples:burtin",   () -> compile("burtin")

gulp.task "examples", ["examples:anscombe", "examples:burtin"]
