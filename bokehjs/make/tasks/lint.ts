import {argv} from "yargs"
import {join} from "path"

import {Linter, Configuration} from "tslint"

import {task, log} from "../task"
import {read, scan} from "../fs"
import * as paths from "../paths"

function lint(dir: string): void {
  let success = true

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
      success = false

      for (const line of result.output.trim().split("\n"))
        log(line)
    }
  }

  if (argv.emitError && !success)
    process.exit(1)
}

task("tslint:lib", async () => {
  lint(paths.src_dir.lib)
})

task("tslint:test", async () => {
  lint(paths.src_dir.test)
})

task("tslint:examples", async () => {
  lint(paths.src_dir.examples)
})

task("tslint", ["tslint:lib", "tslint:test", "tslint:examples"])
