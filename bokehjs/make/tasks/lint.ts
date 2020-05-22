import {argv} from "yargs"
import {join, normalize} from "path"

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

task("eslint:make", async () => await eslint(paths.make_dir))
task("eslint:lib", async () => await eslint(paths.src_dir.lib))
task("eslint:compiler", async () => await eslint(paths.src_dir.compiler))
task("eslint:test", ["eslint:test:unit", "eslint:test:defaults", "eslint:test:integration", "eslint:test:codebase", "eslint:test:devtools"])
task("eslint:examples", async () => await eslint(paths.src_dir.examples))


task("eslint:test:unit", async () => await eslint(join(paths.src_dir.test, "unit")))
task("eslint:test:defaults", async () => await eslint(join(paths.src_dir.test, "defaults")))
task("eslint:test:integration", async () => await eslint(join(paths.src_dir.test, "integration")))
task("eslint:test:codebase", async () => await eslint(join(paths.src_dir.test, "codebase")))
task("eslint:test:devtools", async () => await eslint(join(paths.src_dir.test, "devtools")))

task("eslint", ["eslint:make", "eslint:lib", "eslint:compiler", "eslint:test", "eslint:examples"])

task("lint", ["eslint"])
