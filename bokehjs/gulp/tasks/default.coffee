# default - message + brief help

gulp = require "gulp"
runSequence = require "run-sequence"

gulp.task "default", ->
  console.log('Building BokehJS for developer mode ...')
  runSequence("scripts:build", "styles:build", "install", "watch")
