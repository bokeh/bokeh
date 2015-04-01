gulp = require "gulp"

gulp.task "build", ["scripts:minify", "styles:minify"], ->
