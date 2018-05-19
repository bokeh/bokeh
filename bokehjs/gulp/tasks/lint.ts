import * as gulp from "gulp"
import {argv} from "yargs"
import {join} from "path"
const tslint = require('gulp-tslint')

import * as paths from "../paths"

gulp.task("tslint", () => {
  const srcs = [
    join(paths.src_dir.lib),
    join(paths.base_dir, "test"),
    join(paths.base_dir, "examples"),
  ]
  return gulp
    .src(srcs.map((dir) => join(dir, "**", "*.ts")))
    .pipe(tslint({
      rulesDirectory: join(paths.base_dir, "tslint", "rules"),
      formatter: "stylish",
      fix: argv.fix || false,
    }))
    .pipe(tslint.report({summarizeFailureOutput: true}))
})
