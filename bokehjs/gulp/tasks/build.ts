import * as gulp from "gulp"

gulp.task("build", gulp.series("scripts", "styles", "compiler:build"))

gulp.task("dev-build", gulp.series("scripts:build", "styles:build"))
