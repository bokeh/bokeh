# styles - build or minify CSS

gulp = require "gulp"
less = require "gulp-less"
minifyCSS = require "gulp-minify-css"
rename = require "gulp-rename"
runSequence = require "run-sequence"

paths = require "../paths"
utils = require "../utils"

gulp.task "styles:build", ->
  gulp.src paths.less.sources
    .pipe less()
    .pipe gulp.dest paths.buildDir.css

gulp.task "styles:minify", ->
  opts = {}
  gulp.src paths.css.sources
    .pipe minifyCSS opts
    .pipe rename "bokeh.min.css"
    .pipe gulp.dest paths.buildDir.css

gulp.task "styles", (cb) ->
  runSequence("styles:build", "styles:minify", cb)
