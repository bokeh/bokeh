gulp = require "gulp"
gutil = require "gulp-util"
through = require "through"
cp = require "child_process"

paths = require "../paths"
utils = require "../utils"

mocha = (options={}) ->
  return through(
    (file) ->
      if @_files? then @_files.push(file.path) else @_files = [file.path]
    () ->
      proc = cp.spawn("node_modules/.bin/mocha",
                      ["--compilers", "coffee:coffee-script/register", "./test/index.coffee"].concat(@_files),
                      {stdio: 'inherit'})

      proc.on "error", (err) =>
        @emit("error", new gutil.PluginError("mocha", err))

      proc.on "exit", (code) =>
        if code != 0
          @emit("error", new gutil.PluginError("mocha", "tests failed"))
        else
          @emit("end")
  )

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
