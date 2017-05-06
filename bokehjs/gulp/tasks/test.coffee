gulp = require "gulp"
gutil = require "gulp-util"
through = require "through"
cp = require "child_process"
argv = require("yargs").argv

paths = require "../paths"
utils = require "../utils"

mocha = (options={}) ->
  return through(
    (file) ->
      if @_files? then @_files.push(file.path) else @_files = [file.path]
    () ->
      _mocha = "node_modules/mocha/bin/_mocha"

      if not options.coverage
        args = [_mocha]
      else
        args = ["node_modules/.bin/istanbul", "cover", _mocha, "--"]

      if argv.debug
        args.unshift("debug")

      args = args.concat(
        ["--compilers", "coffee:coffee-script/register,ts:ts-node/register"],
        ["--reporter", argv.reporter ? "spec"],
        ["--slow", "5s"]
        ["./test/index.coffee"],
        @_files,
      )

      env = Object.assign({}, process.env, {
        TS_NODE_PROJECT: "./test/tsconfig.json"
      })

      proc = cp.spawn(process.execPath, args, {stdio: 'inherit', env: env})

      proc.on "error", (err) =>
        @emit("error", new gutil.PluginError("mocha", err))

      proc.on "exit", (code) =>
        if code != 0
          @emit("error", new gutil.PluginError("mocha", "tests failed"))
        else
          @emit("end")

      handler = () -> proc.kill()
      process.on('exit',    handler)
      process.on('SIGTERM', handler)
      process.on('SIGINT',  handler)
  )

gulp.task "test:coverage", ["defaults:generate"], () ->
  gulp.src(["./test/all.coffee"]).pipe(mocha({coverage: true}))

gulp.task "test", ["defaults:generate"], () ->
  gulp.src(["./test/all.coffee"]).pipe(mocha())

gulp.task "test:client", ->
  gulp.src(["./test/client.coffee"]).pipe(mocha())

gulp.task "test:core", ->
  gulp.src(["./test/core"]).pipe(mocha())

gulp.task "test:document", ->
  gulp.src(["./test/document.coffee"]).pipe(mocha())

gulp.task "test:model", ->
  gulp.src(["./test/model.coffee"]).pipe(mocha())

gulp.task "test:models", ->
  gulp.src(["./test/models"]).pipe(mocha())

gulp.task "test:utils", ->
  gulp.src(["./test/utils.coffee"]).pipe(mocha())

gulp.task "test:common", ["defaults:generate"], ->
  gulp.src(["./test/common"]).pipe(mocha())

gulp.task "test:size", ->
  gulp.src(["./test/size.coffee"]).pipe(mocha())

utils.buildWatchTask("test", paths.test.watchSources)
