import * as gulp from "gulp"
import * as less from "gulp-less"
const uglifycss = require("gulp-uglifycss") // XXX: no typings
import * as rename from "gulp-rename"
import * as runSequence from "run-sequence"
import * as sourcemaps from "gulp-sourcemaps"

import * as paths from "../paths"

gulp.task("styles:build", () => {
  return gulp.src(paths.less.sources)
    .pipe(sourcemaps.init({
      loadMaps: true,
    }))
    .pipe(less())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.build_dir.css))
})

gulp.task("styles:minify", () => {
  return gulp.src(paths.css.sources)
    .pipe(rename((path) => path.basename += ".min"))
    .pipe(sourcemaps.init({
      loadMaps: true,
    }))
    .pipe(uglifycss())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.build_dir.css))
})

gulp.task("styles", (cb: (arg?: any) => void) => {
  runSequence("styles:build", "styles:minify", cb)
})
