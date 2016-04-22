_ = require "underscore"
path = require "path"
child_process = require "child_process"
gulp = require "gulp"
gutil = require "gulp-util"
argv = require("yargs").argv

gulp.task "defaults:generate", (cb) ->
  generateDefaults = (next) ->
    if argv.verbose then gutil.log("Generating defaults.coffee")
    bokehjsdir = path.normalize(process.cwd())
    basedir = path.normalize(bokehjsdir + "/..")
    oldpath = process.env['PYTHONPATH']
    if oldpath?
      pypath = "#{basedir}:#{oldpath}"
    else
      pypath = basedir
    env = _.extend({}, process.env, { PYTHONPATH: pypath })
    handle = child_process.spawn("python", ['./gulp/tasks/generate_defaults.py', './test/'], {
      env: env,
      cwd: bokehjsdir
    })
    handle.stdout.on 'data', (data) ->
      ("" + data)
        .split('\n')
        .filter (line) -> line.trim().length != 0
        .forEach (line) -> gutil.log("generate_defaults.py: #{line}")
    handle.stderr.on 'data', (data) ->
      gutil.log("generate_defaults.py: #{data}")
    handle.on 'close', (code) ->
      if code != 0
        cb(new Error("generate_defaults.py exited code #{code}"))
      else
        cb()

  generateDefaults(cb)
  null # XXX: this is extremely important to allow cb() to work
