gulp = require "gulp"
less = require "gulp-less"
minifyCSS = require "gulp-minify-css"
rename = require "gulp-rename"

paths = require "../paths"
utils = require "../utils"

gulp.task "styles", ->
  gulp.src paths.less.sources
    .pipe less()
    .pipe gulp.dest paths.buildDir.css

minifyTask = ->
  opts = {}

  gulp.src paths.css.sources
    .pipe minifyCSS opts
    .pipe rename "bokeh.min.css"
    .pipe gulp.dest paths.buildDir.css

gulp.task "styles:minify", ["styles"], minifyTask
gulp.task "styles:minify-only", minifyTask

utils.buildWatchTask "styles", paths.less.watchSources
utils.buildWatchTask "styles:minify",
                     paths.css.watchSources,
                     ["styles:minify-only"]
