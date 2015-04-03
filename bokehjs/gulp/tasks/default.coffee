# default - message + brief help

gulp = require "gulp"
runSequence = require "run-sequence"

gulp.task "default", (cb) ->
  console.log('Building BokehJS for developer mode ...')
  runSequence(["scripts", "styles"], "install", "watch", cb)
