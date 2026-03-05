import {join, normalize} from "node:path"

import {ESLint} from "eslint"
import chalk from "chalk"

import {argv} from "../args.js"
import {task, log, BuildError} from "../task.js"
import * as paths from "../paths.js"

import {glob} from "#compiler/sys.js"

async function eslint(dir: string): Promise<void> {
  const {fix} = argv
  const eslint = new ESLint({cache: true, fix})

  const tsconfig_url = `file://${join(dir, "tsconfig.json")}`
  const {default: tsconfig_json} = await import(tsconfig_url, {with: {type: "json"}})
  const tsconfig = tsconfig_json as {include?: string[], exclude?: string[]}

  const included_files = new Set(glob(...(tsconfig.include ?? []).map((pat) => normalize(join(dir, pat)))))
  const excluded_files = new Set(glob(...(tsconfig.exclude ?? []).map((pat) => normalize(join(dir, pat)))))

  const files = []
  for (const file of included_files) {
    if (!excluded_files.has(file)) {
      files.push(file)
    }
  }

  const results = await eslint.lintFiles(files)

  const errors = results.some(result => result.errorCount != 0)
  const warnings = results.some(result => result.warningCount != 0)

  if (fix) {
    await ESLint.outputFixes(results)
  }

  if (errors || warnings) {
    const formatter = await eslint.loadFormatter("stylish")
    const output = await formatter.format(results)

    for (const line of output.trim().split("\n")) {
      log(line)
    }
  }

  if (errors) {
    const total = results.reduce((total, result) => total + result.errorCount, 0)
    throw new BuildError("eslint", `lint failed with ${chalk.red(total)} errors`)
  }
}

task("eslint:test:unit", async () => await eslint(join(paths.src_dir.test, "unit")))
task("eslint:test:defaults", async () => await eslint(join(paths.src_dir.test, "defaults")))
task("eslint:test:integration", async () => await eslint(join(paths.src_dir.test, "integration")))
task("eslint:test:codebase", async () => await eslint(join(paths.src_dir.test, "codebase")))
task("eslint:test:devtools", async () => await eslint(join(paths.src_dir.test, "devtools")))
task("eslint:test:common", async () => await eslint(paths.src_dir.test))

task("eslint:make", async () => await eslint(paths.make_dir))
task("eslint:lib", async () => await eslint(paths.src_dir.lib))
task("eslint:compiler", async () => await eslint(paths.src_dir.compiler))
task("eslint:server", async () => await eslint(paths.src_dir.server))
task("eslint:test", ["eslint:test:unit", "eslint:test:defaults", "eslint:test:integration", "eslint:test:codebase", "eslint:test:devtools", "eslint:test:common"])
task("eslint:examples", async () => await eslint(paths.src_dir.examples))

task("eslint", ["eslint:make", "eslint:lib", "eslint:compiler", "eslint:server", "eslint:test", "eslint:examples"])

task("lint", ["eslint"])
