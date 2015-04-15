{spawn} = require "child_process"
gulp = require "gulp"
gutil = require "gulp-util"
paths = require "../paths"

subTasks = ["develop:install-js"]

gulp.task "develop", subTasks, ->

gulp.task "develop:watch", ["develop"], ->
  gulp.watch "#{paths.buildDir.js}/*.js", ["develop:install-js"]
  gulp.watch "#{paths.buildDir.css}/*css", ["develop:install-js"]

outputLine = (line) ->
  prefix = gutil.colors.cyan "setup.py:"
  gutil.log "#{prefix} #{gutil.colors.grey line}"

handleOutput = (data) ->
  data.replace /\s*$/, ""
    .split "\n"
    .forEach outputLine

gulp.task "develop:install-js", (cb) ->
  setup = spawn "python", ["../setup.py", "develop", "--install_js"]
  for output in ["stdout", "stderr"]
    setup[output].setEncoding "utf8"
    setup[output].on "data", handleOutput
  setup.on "exit", ->
    outputLine "DONE!"
    cb()
