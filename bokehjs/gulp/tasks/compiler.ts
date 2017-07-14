import * as browserify from "browserify"
import * as gulp from "gulp"
import * as gutil from "gulp-util"
const ts = require('gulp-typescript')
import {join, resolve} from "path"
const source = require('vinyl-source-stream')

import * as paths from "../paths"

gulp.task("compiler:ts", () => {
  const dir = join(paths.base_dir, "src", "js")
  const tsconfig = require(join(dir, "tsconfig.json"))
  const error = (err: {message: string}) => gutil.log(err.message)
  return gulp.src(join(dir, "compile.ts"))
    .pipe(ts(tsconfig.compilerOptions, ts.reporter.nullReporter()).on('error', error))
    .pipe(gulp.dest(paths.build_dir.js))
})

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
