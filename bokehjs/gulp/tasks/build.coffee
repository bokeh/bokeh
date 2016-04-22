# build - build and minify JS and CSS

gulp = require "gulp"
runSequence = require "run-sequence"

gulp.task "build", ["typings:install"], (cb) ->
  runSequence(["scripts", "styles"], cb)

gulp.task "dev-build", ["typings:install"], (cb) ->
  runSequence(["scripts:build", "styles:build"], cb)
