import * as browserify from "browserify"
import * as gulp from "gulp"
import * as gutil from "gulp-util"
import {join} from "path"
import {argv} from "yargs"
const source = require('vinyl-source-stream')

import {compileTypeScript} from "../compiler"
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

gulp.task("compiler:build", ["compiler:ts"], () => {
  const compilerOpts = {
    entries: [join(paths.build_dir.compiler, "compile.js")],
    browserField: false,
    builtins: false,
    commondir: false,
    insertGlobals: false,
    insertGlobalVars: {
     process: undefined,
     global: undefined,
     'Buffer.isBuffer': undefined,
     Buffer: undefined,
    }
  }
  const b = browserify(compilerOpts)
  b.exclude("babel-core")
  return b.bundle()
          .pipe(source("compiler.js"))
          .pipe(gulp.dest(paths.build_dir.js))
})
