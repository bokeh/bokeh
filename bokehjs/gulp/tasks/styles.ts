import * as gulp from "gulp"
import * as less from "less"
import * as uglifycss from "uglifycss"

import {read, write, rename} from "../utils"
import * as paths from "../paths"

gulp.task("styles:build", async () => {
  for (const src of paths.less.sources) {
    const {css} = await less.render(read(src)!, {filename: src})
    write(rename(src, {dir: paths.build_dir.css, ext: ".css"}), css)
  }
})

gulp.task("styles:minify", ["styles:build"], (next: () => void) => {
  for (const css of paths.css.sources) {
    const min = uglifycss.processFiles([css])
    write(rename(css, {ext: '.min.css'}), min)
  }

  next()
})

gulp.task("styles", ["styles:minify"])
