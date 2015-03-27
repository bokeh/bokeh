gulp = require "gulp"

defaultTasks = [
  "scripts:watch",
  "develop:watch",
]
gulp.task "default", defaultTasks, ->
