import lesscss from "less"

import chalk from "chalk"
import {argv} from "yargs"

import {task, log} from "../task"
import {scan, read, write, rename} from "@compiler/sys"
import * as paths from "../paths"

task("styles:compile", async () => {
  const errors = []
  for (const src of scan(paths.src_dir.less, [".less"])) {
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
    log(`There were ${chalk.red("" + errors.length)} Less errors:\n${errors.join("\n")}`)
    if (argv.emitError)
      process.exit(1)
  }
})

task("styles:build", ["styles:compile"])

task("styles", ["styles:build"])
