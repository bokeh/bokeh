import * as gulp from "gulp"
import * as gutil from "gulp-util"
import * as runSequence from "run-sequence"

gulp.task("default", (cb: (arg?: any) => void) => {
  gutil.log("Building BokehJS for developer mode ...")
  runSequence("build", "install", "watch", cb)
})
