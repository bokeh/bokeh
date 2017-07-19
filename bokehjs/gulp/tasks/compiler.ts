import * as browserify from "browserify"
import * as gulp from "gulp"
import * as gutil from "gulp-util"
const ts = require('gulp-typescript')
import {join} from "path"
const source = require('vinyl-source-stream')

import * as paths from "../paths"

gulp.task("compiler:ts", () => {
  const error = (err: {message: string}) => gutil.log(err.message)
  const tsconfig = require(join(paths.src_dir.compiler, "tsconfig.json"))
  return gulp.src(join(paths.src_dir.compiler, "compile.ts"))
    .pipe(ts(tsconfig.compilerOptions, ts.reporter.nullReporter()).on('error', error))
    .pipe(gulp.dest(paths.build_dir.compiler))
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
  return browserify(compilerOpts)
    .bundle()
    .pipe(source("compiler.js"))
    .pipe(gulp.dest(paths.build_dir.js))
})
