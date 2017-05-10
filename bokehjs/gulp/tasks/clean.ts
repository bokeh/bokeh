import * as del from "del"
import * as gulp from "gulp"

import * as paths from "../paths"

gulp.task("clean", ["clean:scripts", "clean:styles"])

gulp.task("clean:all", () => {
  return del(paths.buildDir.all)
})

gulp.task("clean:scripts", () => {
  return del(paths.buildDir.js)
})

gulp.task("clean:styles", () => {
  return del(paths.buildDir.css)
})
