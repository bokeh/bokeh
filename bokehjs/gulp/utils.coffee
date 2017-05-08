gulp = require "gulp"

buildWatchTask = (name, paths, tasks) ->
  tasks = [name, ] unless tasks?
  gulp.task "#{name}:watch", [name, ], ->
    gulp.watch paths, tasks

module.exports =
  buildWatchTask: buildWatchTask
