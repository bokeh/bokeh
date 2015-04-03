# default - message + brief help

gulp = require "gulp"
gutil = require "gulp-util"
runSequence = require "run-sequence"

gulp.task "default", (cb) ->
  gutil.log('Building BokehJS for developer mode ...')
  runSequence("build", "install", "watch", cb)
