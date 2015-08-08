# scripts - build or minify JS

browserify = require "browserify"
gulp = require "gulp"
rename = require "gulp-rename"
transform = require "vinyl-transform"
uglify = require "gulp-uglify"
runSequence = require "run-sequence"
sourcemaps = require "gulp-sourcemaps"
source = require 'vinyl-source-stream'
buffer = require 'vinyl-buffer'
paths = require "../paths"

gulp.task "scripts:build", ->
  opts =
    entries: ['./src/coffee/main.coffee']
    extensions: [".coffee", ".eco"]
    debug: true

  browserify opts
    .transform "browserify-eco"
    .transform "coffeeify"
    .bundle()
    .pipe source paths.coffee.destination.full
    .pipe buffer()
    .pipe sourcemaps.init
      loadMaps: true
    .pipe sourcemaps.write './'
    .pipe gulp.dest paths.buildDir.js

gulp.task "scripts:minify", ->
  gulp.src paths.coffee.destination.fullWithPath
    .pipe rename (path) -> path.basename += '.min'
    .pipe sourcemaps.init
      loadMaps: true
    .pipe uglify()
    .pipe sourcemaps.write './'
    .pipe gulp.dest paths.buildDir.js

gulp.task "scripts", (cb) ->
  runSequence("scripts:build", "scripts:minify", cb)
