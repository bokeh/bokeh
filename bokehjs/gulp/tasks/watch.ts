import * as gulp from "gulp"
import * as runSequence from "run-sequence"
import * as paths from "../paths"

gulp.task("watch", () => {
  gulp.watch(`${paths.coffee.watchSources}`, () => {
    runSequence("scripts:build")
  })
  gulp.watch(`${paths.less.watchSources}`, () => {
    runSequence("styles:build")
  })
})
