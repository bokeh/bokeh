gulp = require "gulp"
mocha = require "gulp-mocha"

paths = require "../paths"
utils = require "../utils"

gulp.task "test", ["defaults:generate"], ->
  gulp.src ["./test", "./test/all.coffee"], read: false
    .pipe mocha()

gulp.task "test:client", ->
  gulp.src ["./test", "./test/client.coffee"], read: false
    .pipe mocha()

gulp.task "test:core", ->
  gulp.src ["./test", "./test/core"], read: false
    .pipe mocha()

gulp.task "test:document", ->
  gulp.src ["./test", "./test/document.coffee"], read: false
    .pipe mocha()

gulp.task "test:models", ->
  gulp.src ["./test", "./test/models"], read: false
    .pipe mocha()

gulp.task "test:utils", ->
  gulp.src ["./test", "./test/utils.coffee"], read: false
    .pipe mocha()

gulp.task "test:common", ["defaults:generate"], ->
  gulp.src ["./test", "./test/common"], read: false
    .pipe mocha()

gulp.task "test:size", ->
  gulp.src ["./test", "./test/size.coffee"], read: false
    .pipe mocha()

utils.buildWatchTask "test", paths.test.watchSources
