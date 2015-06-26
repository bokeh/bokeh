# scripts - build or minify JS

browserify = require "browserify"
change = require "gulp-change"
gulp = require "gulp"
rename = require "gulp-rename"
transform = require "vinyl-transform"
uglify = require "gulp-uglify"
runSequence = require "run-sequence"
sourcemaps = require "gulp-sourcemaps"
argv = require("yargs").argv

paths = require "../paths"
utils = require "../utils"

gulp.task "scripts:build", ->
  opts =
    extensions: [".coffee", ".eco"]

  opts.debug = if argv.debug then argv.debug else false

  browserified = transform (filename) ->
    browserify filename, opts
      .transform "browserify-eco"
      .transform "coffeeify"
      .bundle()

  gulp.src paths.coffee.sources
    .pipe browserified
    .pipe change (content) ->
      "(function() { var define = undefined; #{content} })()"
    .pipe rename paths.coffee.destination.full
    .pipe gulp.dest paths.buildDir.js

gulp.task "scripts:minify", ->
  gulp.src paths.coffee.destination.fullWithPath
    .pipe rename paths.coffee.destination.minified
    .pipe gulp.dest paths.buildDir.js
    .pipe sourcemaps.init
      loadMaps: true
    .pipe uglify()
    .pipe sourcemaps.write './'
    .pipe gulp.dest paths.buildDir.js

gulp.task "scripts", (cb) ->
  runSequence("scripts:build", "scripts:minify", cb)
