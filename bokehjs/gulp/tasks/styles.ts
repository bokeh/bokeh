import * as gulp from "gulp"
import * as less from "gulp-less"
const uglifycss = require("gulp-uglifycss") // XXX: no typings
import * as rename from "gulp-rename"
import * as runSequence from "run-sequence"
import * as sourcemaps from "gulp-sourcemaps"

import * as paths from "../paths"

gulp.task("styles:build", () => {
  gulp.src(paths.less.sources)
    .pipe(sourcemaps.init({
      loadMaps: true,
    }))
    .pipe(less())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.buildDir.css))
})

gulp.task("styles:minify", () => {
  gulp.src(paths.css.sources)
    .pipe(rename((path) => path.basename += ".min"))
    .pipe(gulp.dest(paths.buildDir.css))
    .pipe(sourcemaps.init({
      loadMaps: true,
    }))
    .pipe(uglifycss())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.buildDir.css))
})

gulp.task("styles", (cb: (arg?: any) => void) => {
  runSequence("styles:build", "styles:minify", cb)
})
