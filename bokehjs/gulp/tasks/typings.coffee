path = require("path")
gulp = require("gulp")
through = require("through2")
typings_core = require("typings-core")

install = (file, enc, cb) ->
  opts = {production: false, cwd: path.dirname(file.path)}
  typings_core.install(opts).then(() -> cb(null, file))

gulp.task "typings:install", () ->
  gulp.src("./typings.json")
      .pipe(through.obj(install))
