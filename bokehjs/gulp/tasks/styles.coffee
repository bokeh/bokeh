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

gulp.task "styles:install", ->
  gulp.src "#{paths.buildDir.js}*.css"
    .pipe gulp.dest paths.serverDir.css

gulp.task "styles", ->
  runSequence("styles:build", "styles:minify", "styles:install")

gulp.task "styles:watch", ->
  gulp.watch "#{paths.css.watchSources}", ->
    runSequence("styles:build", "styles:install")
