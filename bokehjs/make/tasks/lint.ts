import {join, normalize} from "node:path"

import {ESLint} from "eslint"
import chalk from "chalk"

import {argv} from "../args.js"
import {task, log, BuildError} from "../task.js"
import * as paths from "../paths.js"

import {glob} from "#compiler/sys.js"

async function eslint(dirs: string[]): Promise<void> {
  const {fix} = argv
  const eslint = new ESLint({cache: true, cacheStrategy: "content", fix})

  const files = new Set<string>()
  for (const dir of dirs) {
    const tsconfig_url = `file://${join(dir, "tsconfig.json")}`
    const {default: tsconfig_json} = await import(tsconfig_url, {with: {type: "json"}})
    const tsconfig = tsconfig_json as {include?: string[], exclude?: string[]}

    const included_files = new Set(glob(...(tsconfig.include ?? []).map((pat) => normalize(join(dir, pat)))))
    const excluded_files = new Set(glob(...(tsconfig.exclude ?? []).map((pat) => normalize(join(dir, pat)))))

    for (const file of included_files) {
      if (!excluded_files.has(file)) {
        files.add(file)
      }
    }
  }

  const results = await eslint.lintFiles([...files])

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

const test_subdirs = [
  "framework",
  "defaults",
  "unit",
  "integration",
  "codebase",
  "devtools",
]

for (const name of test_subdirs) {
  task(`eslint:test:${name}`, async () => await eslint([join(paths.src_dir.test, name)]))
}

task("eslint:make", async () => await eslint([paths.make_dir]))
task("eslint:lib", async () => await eslint([paths.src_dir.lib]))
task("eslint:compiler", async () => await eslint([paths.src_dir.compiler]))
task("eslint:server", async () => await eslint([paths.src_dir.server]))
task("eslint:test", async () => await eslint(test_subdirs.map((name) => join(paths.src_dir.test, name))))
task("eslint:examples", async () => await eslint([paths.src_dir.examples]))

task("eslint", async () => await eslint([
  paths.make_dir,
  paths.src_dir.lib,
  paths.src_dir.compiler,
  paths.src_dir.server,
  ...test_subdirs.map((name) => join(paths.src_dir.test, name)),
  paths.src_dir.examples,
]))

task("lint", ["eslint"])
