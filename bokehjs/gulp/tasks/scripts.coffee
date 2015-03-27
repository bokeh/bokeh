browserify = require "browserify"
gulp = require "gulp"
source = require "vinyl-source-stream"
uglify = require "gulp-uglifyjs"

paths = require "../paths"
utils = require "../utils"

gulp.task "scripts", ->
  opts =
    entries: paths.coffee.sources,
    extensions: [".coffee", ".eco"]

  browserify opts
    .transform "browserify-eco"
    .transform "coffeeify"
    .bundle()
    .pipe source paths.coffee.destination.full
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
