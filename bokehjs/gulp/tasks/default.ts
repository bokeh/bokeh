import * as gulp from "gulp"
import * as gutil from "gulp-util"

gulp.task("default", gulp.series(() => {
    gutil.log("Building BokehJS for developer mode ...")
  }, "build", "install", "watch"),
)
