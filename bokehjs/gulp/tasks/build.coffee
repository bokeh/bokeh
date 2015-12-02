# build - build and minify JS and CSS

gulp = require "gulp"
runSequence = require "run-sequence"

gulp.task "build", (cb) ->
  runSequence(["scripts", "styles"], cb)

gulp.task "dev-build", (cb) ->
  runSequence(["scripts:build", "styles:build"], cb)
