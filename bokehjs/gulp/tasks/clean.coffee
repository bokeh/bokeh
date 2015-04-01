del = require "del"
gulp = require "gulp"

paths = require "../paths"

subTasks = [
  "clean:scripts",
  "clean:styles",
]

gulp.task "clean", subTasks, ->

gulp.task "clean:all", ->
  del paths.buildDir.all

gulp.task "clean:scripts", ->
  del paths.buildDir.js

gulp.task "clean:styles", ->
  del paths.buildDir.css
