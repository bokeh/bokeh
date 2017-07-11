import * as browserify from "browserify"
import * as gulp from "gulp"
import * as path from "path"
const source = require('vinyl-source-stream')

import * as paths from "../paths"

gulp.task("compiler:build", () => {
  const compilerOpts = {
    entries: [path.resolve(path.join('src', 'js', 'compile.coffee'))],
    extensions: [".js", ".coffee"],
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
  return browserify(compilerOpts)
    .transform("coffeeify")
    .bundle()
    .pipe(source("compile.js"))
    .pipe(gulp.dest(paths.build_dir.js))
})
