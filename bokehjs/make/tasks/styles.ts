import lesscss from "less"
import chalk from "chalk"
import {basename} from "path"

import {task, BuildError} from "../task"
import {scan, read, write, rename} from "@compiler/sys"
import * as paths from "../paths"

task("styles:compile", async () => {
  const errors = []
  for (const src of scan(paths.src_dir.less, [".less"])) {
    if (basename(src).startsWith("_")) {
      continue
    }

    try {
      const less = read(src)!
      const {css} = await lesscss.render(less, {filename: src})
      const dst = rename(src, {
        base: paths.src_dir.less,
        dir: paths.build_dir.css,
        ext: ".css",
      })
      write(dst, css)
    } catch (error) {
      errors.push(error.toString())
    }
  }

  if (errors.length != 0) {
    throw new BuildError("less", `There were ${chalk.red("" + errors.length)} Less errors:\n${errors.join("\n")}`)
  }
})
