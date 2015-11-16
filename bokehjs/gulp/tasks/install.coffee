# install - use setup.py to copy JS+CSS files from "build/" to "bokeh/server/static"

{spawn} = require "child_process"
gulp = require "gulp"
gutil = require "gulp-util"
paths = require "../paths"

outputLine = (line) ->
  prefix = gutil.colors.cyan "setup.py:"
  gutil.log "#{prefix} #{gutil.colors.grey line}"

handleOutput = (data) ->
  data.replace /\s*$/, ""
    .split "\n"
    .forEach outputLine

gulp.task "install", ->
  # installs js and css
  # note: sets cwd as parent dir so that LICENSE.txt is accessible to setup.py 
  setup = spawn "python", ["setup.py", "--install_js"], {cwd: "../"}
  for output in ["stdout", "stderr"]
    setup[output].setEncoding "utf8"
    setup[output].on "data", handleOutput
  setup.on "exit", ->
    outputLine "DONE!"
