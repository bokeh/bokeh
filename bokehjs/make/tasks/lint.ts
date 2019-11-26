import {argv} from "yargs"
import {join, normalize} from "path"

import * as ts from "tslint"
import * as es from "eslint"

import {task, log} from "../task"
import * as paths from "../paths"

import {glob} from "@compiler/sys"

async function eslint(dir: string): Promise<void> {
  const engine = new es.CLIEngine({
    configFile: "./eslint.json",
    extensions: [".ts"],
    fix: argv.fix === true,
  })

  const {include} = await import(join(dir, "tsconfig.json")) as {include: string[]}
  const files = glob(...include.map((pat) => normalize(join(dir, pat))))

  const report = engine.executeOnFiles(files)
  es.CLIEngine.outputFixes(report)

  if (report.errorCount != 0) {
    const formatter = engine.getFormatter()
    const output = formatter(report.results)

    for (const line of output.trim().split("\n"))
      log(line)

    if (argv.emitError)
      process.exit(1)
  }
}

function tslint(dir: string): void {
  const options = {
    rulesDirectory: join(paths.base_dir, "tslint", "rules"),
    formatter: "stylish",
    fix: argv.fix === true,
  }

  const program = ts.Linter.createProgram(join(dir, "tsconfig.json"))
  const linter = new ts.Linter(options, program)
  const files = ts.Linter.getFileNames(program)

  for (const file of files) {
    const config = ts.Configuration.findConfiguration("./tslint.json", file).results
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

task("eslint:make", async () => await eslint(paths.make_dir))
task("eslint:lib", async () => await eslint(paths.src_dir.lib))
task("eslint:compiler", async () => await eslint(paths.src_dir.compiler))
task("eslint:test", ["eslint:test:tests", "eslint:test:codebase", "eslint:test:devtools"])
task("eslint:examples", async () => await eslint(paths.src_dir.examples))

task("eslint:test:tests", async () => await eslint(paths.src_dir.test))
task("eslint:test:codebase", async () => await eslint(join(paths.src_dir.test, "codebase")))
task("eslint:test:devtools", async () => await eslint(join(paths.src_dir.test, "devtools")))

task("eslint", ["eslint:make", "eslint:lib", "eslint:compiler", "eslint:test", "eslint:examples"])

task("tslint:make", async () => tslint(paths.make_dir))
task("tslint:lib", async () => tslint(paths.src_dir.lib))
task("tslint:compiler", async () => tslint(paths.src_dir.compiler))
task("tslint:test", async () => tslint(paths.src_dir.test))
task("tslint:examples", async () => tslint(paths.src_dir.examples))

task("tslint", ["tslint:make", "tslint:lib", "tslint:compiler", "tslint:test", "tslint:examples"])

task("lint", ["eslint", "tslint"])
