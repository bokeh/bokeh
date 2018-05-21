import * as gulp from "gulp"
import * as gutil from "gulp-util"
import {argv} from "yargs"
import {join} from "path"

import {Linter, Configuration} from "tslint"

import {read, scan} from "../utils"
import * as paths from "../paths"

function lint(dir: string): void {
  for (const file of scan(dir, [".ts"])) {
    const options = {
      rulesDirectory: join(paths.base_dir, "tslint", "rules"),
      formatter: "stylish",
      fix: argv.fix || false,
    }

    const linter = new Linter(options)
    const config = Configuration.findConfiguration("./tslint.json", file).results
    linter.lint(file, read(file)!, config)
    const result = linter.getResult()

    if (result.errorCount != 0) {
      for (const line of result.output.trim().split("\n"))
        gutil.log(line)
    }
  }
}

gulp.task("tslint:lib", (next: () => void) => {
    lint(paths.src_dir.lib)
    next()
})

gulp.task("tslint:test", (next: () => void) => {
    lint(paths.src_dir.test)
    next()
})

gulp.task("tslint:examples", (next: () => void) => {
    lint(paths.src_dir.examples)
    next()
})

gulp.task("tslint", ["tslint:lib", "tslint:test", "tslint:examples"])
