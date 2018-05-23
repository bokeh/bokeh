import * as less from "less"
import * as uglifycss from "uglifycss"

import {task} from "../task"
import {read, write, rename} from "../fs"
import * as paths from "../paths"

task("styles:build", async () => {
  for (const src of paths.less.sources) {
    const {css} = await less.render(read(src)!, {filename: src})
    write(rename(src, {dir: paths.build_dir.css, ext: ".css"}), css)
  }
})

task("styles:minify", ["styles:build"], async () => {
  for (const css of paths.css.sources) {
    const min = uglifycss.processFiles([css])
    write(rename(css, {ext: '.min.css'}), min)
  }
})

task("styles", ["styles:minify"])
