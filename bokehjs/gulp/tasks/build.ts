import * as gulp from "gulp"
import * as runSequence from "run-sequence"

gulp.task("build", [], (cb: (arg?: any) => void) => {
  runSequence(["scripts", "styles", "compiler:build"], cb)
})

gulp.task("dev-build", [], (cb: (arg?: any) => void) => {
  runSequence(["scripts:build", "styles:build"], cb)
})
