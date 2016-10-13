_ = require "underscore"
gulp = require "gulp"
taskList = require "gulp-task-listing"

utils = require "./utils"

for tasks in utils.loadTasks "#{__dirname}/tasks/"
  for task in tasks
    require task.path

gulp.task "help", taskList
