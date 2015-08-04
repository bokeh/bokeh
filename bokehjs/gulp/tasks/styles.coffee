# styles - build or minify CSS

gulp = require "gulp"
less = require "gulp-less"
minifyCSS = require "gulp-minify-css"
rename = require "gulp-rename"
runSequence = require "run-sequence"
sourcemaps = require "gulp-sourcemaps"

paths = require "../paths"
utils = require "../utils"

gulp.task "styles:build", ->
  gulp.src paths.less.sources
    .pipe sourcemaps.init
      loadMaps: true
    .pipe less()
    .pipe sourcemaps.write './'
    .pipe gulp.dest paths.buildDir.css

gulp.task "styles:minify", ->
  gulp.src paths.css.sources
    .pipe rename "bokeh.min.css"
    .pipe sourcemaps.init
      loadMaps: true
    .pipe minifyCSS()
    .pipe sourcemaps.write './'
    .pipe gulp.dest paths.buildDir.css

gulp.task "styles", (cb) ->
  runSequence("styles:build", "styles:minify", cb)
