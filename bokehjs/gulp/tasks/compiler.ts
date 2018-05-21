import * as gulp from "gulp"
import * as gutil from "gulp-util"
import {join} from "path"
import {argv} from "yargs"

import {compileTypeScript} from "../compiler"
import {Linker} from "../linker"
import * as paths from "../paths"

gulp.task("compiler:ts", (next: () => void) => {
  const success = compileTypeScript(join(paths.src_dir.compiler, "tsconfig.json"), {
    log: gutil.log,
    out_dir: paths.build_dir.compiler,
  })

  if (argv.emitError && !success)
    process.exit(1)

  next()
})

gulp.task("compiler:build", ["compiler:ts"], (next: () => void) => {
  const entries = [join(paths.build_dir.compiler, "compile.js")]
  const bases = [paths.build_dir.compiler, "./node_modules"]
  const ignores = ["babel-core"]
  const builtins = true

  const linker = new Linker({entries, bases, ignores, builtins})
  const [bundle] = linker.link()

  bundle.write(join(paths.build_dir.js, "compiler.js"))

  next()
})
