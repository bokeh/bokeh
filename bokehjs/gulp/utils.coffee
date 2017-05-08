# Various utilities for working with code
fs = require "fs"
gulp = require "gulp"
path = require "path"

scriptFilter = (name) ->
  /(\.(js|coffee|ts)$)/i.test(path.extname(name))

loadTasks = (dir) ->
  tasks = fs.readdirSync(dir).filter scriptFilter
  [path: "#{dir}#{task}", name: path.basename task, task.slice(task.lastIndexOf ".") for task in tasks]

buildWatchTask = (name, paths, tasks) ->
  tasks = [name, ] unless tasks?
  gulp.task "#{name}:watch", [name, ], ->
    gulp.watch paths, tasks

module.exports =
  buildWatchTask: buildWatchTask
  loadTasks: loadTasks
