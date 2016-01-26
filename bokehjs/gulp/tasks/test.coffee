gulp = require "gulp"
mocha = require "gulp-mocha"

paths = require "../paths"
utils = require "../utils"

gulp.task "test", ["defaults:generate"], ->
  gulp.src "./test", read: false
    .pipe mocha()

utils.buildWatchTask "test", paths.test.watchSources
