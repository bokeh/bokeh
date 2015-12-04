gulp = require "gulp"
mocha = require "gulp-mocha"

paths = require "../paths"
utils = require "../utils"

gulp.task "test", ->
  gulp.src "./test", read: false
    .pipe mocha({grep: 'Defaults'})

utils.buildWatchTask "test", paths.test.watchSources
