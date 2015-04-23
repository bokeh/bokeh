# scripts - build or minify JS

browserify = require "browserify"
change = require "gulp-change"
gulp = require "gulp"
rename = require "gulp-rename"
transform = require "vinyl-transform"
uglify = require "gulp-uglifyjs"
runSequence = require "run-sequence"

paths = require "../paths"
utils = require "../utils"

gulp.task "scripts:build", ->
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

gulp.task "scripts:minify", ->
  gulp.src paths.coffee.destination.fullWithPath
    .pipe uglify paths.coffee.destination.minified
    .pipe gulp.dest paths.buildDir.js

gulp.task "scripts", (cb) ->
  runSequence("scripts:build", "scripts:minify", cb)
