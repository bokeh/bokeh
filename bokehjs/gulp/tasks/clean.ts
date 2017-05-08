import * as del from "del"
import * as gulp from "gulp"

import * as paths from "../paths"

gulp.task("clean", ["clean:scripts", "clean:styles"])

gulp.task("clean:all", () => {
  del(paths.buildDir.all)
})

gulp.task("clean:scripts", () => {
  del(paths.buildDir.js)
})

gulp.task("clean:styles", () => {
  del(paths.buildDir.css)
})
