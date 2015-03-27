gulp = require "gulp"
less = require "gulp-less"

paths = require "../paths"
utils = require "../utils"

gulp.task "styles", ->
  gulp.src paths.less.sources
    .pipe less()
    .pipe gulp.dest paths.buildDir.css

utils.buildWatchTask "styles", paths.less.watchSources
