gulp = require "gulp"

gulp.task "build", ["scripts:build", "scripts:minify", "styles:minify"], ->
