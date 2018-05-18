import * as gulp from "gulp"
import * as less from "gulp-less"
import * as uglifycss from "uglifycss"

import {write, rename} from "../utils"
import * as paths from "../paths"

gulp.task("styles:build", () => {
  return gulp.src(paths.less.sources)
    .pipe(less())
    .pipe(gulp.dest(paths.build_dir.css))
})

gulp.task("styles:minify", ["styles:build"], (next: () => void) => {
  for (const css of paths.css.sources) {
    const min = uglifycss.processFiles([css])
    write(rename(css, {ext: '.min.css'}), min)
  }

  next()
})

gulp.task("styles", ["styles:minify"])
