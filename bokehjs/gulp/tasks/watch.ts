import * as gulp from "gulp"
import * as paths from "../paths"

gulp.task("watch", () => {
  gulp.watch(`${paths.lib.watchSources}`, gulp.series("scripts:build"))
  gulp.watch(`${paths.less.watchSources}`, gulp.series("styles:build"))
})
