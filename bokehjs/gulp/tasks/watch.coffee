# watch - watch for changes and build+install unminified version of bokehjs

gulp = require "gulp"
runSequence = require "run-sequence"
paths = require "../paths"

gulp.task "watch", ->
  gulp.watch "#{paths.coffee.watchSources}", ->
    runSequence("scripts:build")
  gulp.watch "#{paths.css.watchSources}", ->
    runSequence("styles:build")
