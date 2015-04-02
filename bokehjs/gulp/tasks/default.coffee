# default - message + brief help

gulp = require "gulp"
runSequence = require "run-sequence"

gulp.task "default", ->
  console.log('BokehJS build system.')
  console.log('Use "gulp build" to build, "gulp watch" to develop')
  console.log('Use "gulp help" to see all commands.')
