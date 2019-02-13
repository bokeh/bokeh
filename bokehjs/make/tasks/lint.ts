import {argv} from "yargs"
import {join} from "path"

import {Linter, Configuration} from "tslint"

import {task, log} from "../task"
import * as paths from "../paths"

function lint(dir: string): void {
  const options = {
    rulesDirectory: join(paths.base_dir, "tslint", "rules"),
    formatter: "stylish",
    fix: argv.fix || false,
  }

  const program = Linter.createProgram(join(dir, "tsconfig.json"))
  const linter = new Linter(options, program)
  const files = Linter.getFileNames(program)

  for (const file of files) {
    const config = Configuration.findConfiguration("./tslint.json", file).results
    const contents = program.getSourceFile(file)!.getFullText()
    linter.lint(file, contents, config)
  }

  const result = linter.getResult()

  if (result.errorCount != 0) {
    for (const line of result.output.trim().split("\n"))
      log(line)

    if (argv.emitError)
      process.exit(1)
  }
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
