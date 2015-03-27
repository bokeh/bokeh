gulp = require "gulp"

defaultTasks = [
  "scripts:minify:watch",
  "styles:minify:watch",
  "develop:watch",
]

gulp.task "default", defaultTasks, ->
