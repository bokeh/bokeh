import * as gulp from "gulp"

gulp.task("build", ["scripts", "styles", "compiler:build"])

gulp.task("dev-build", ["scripts:build", "styles:build"])
