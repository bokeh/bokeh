browserify = require "browserify"
change = require "gulp-change"
gulp = require "gulp"
rename = require "gulp-rename"
transform = require "vinyl-transform"
uglify = require "gulp-uglifyjs"

paths = require "../paths"
utils = require "../utils"

gulp.task "scripts", ->
  opts =
    extensions: [".coffee", ".eco"]

  browserified = transform (filename) ->
    browserify filename, opts
      .transform "browserify-eco"
      .transform "coffeeify"
      .bundle()

  gulp.src paths.coffee.sources
    .pipe browserified
    .pipe change (content) ->
      "(function() { var define = undefined; #{content} })()"
    .pipe rename "bokeh.js"
    .pipe gulp.dest paths.buildDir.js

minifyTask = ->
  gulp.src paths.coffee.destination.fullWithPath
    .pipe uglify paths.coffee.destination.minified
    .pipe gulp.dest paths.buildDir.js

gulp.task "scripts:minify", ["scripts"], minifyTask
gulp.task "scripts:minify-only", minifyTask

utils.buildWatchTask "scripts", paths.coffee.watchSources
utils.buildWatchTask "scripts:minify",
                     paths.coffee.destination.fullWithPath,
                     ["scripts:minify-only"]
