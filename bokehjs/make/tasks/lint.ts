import {spawn} from "node:child_process"
import {dirname, join} from "node:path"
import {fileURLToPath} from "node:url"

import {argv} from "../args.js"
import {task, BuildError} from "../task.js"
import * as paths from "../paths.js"

async function lint(dirs: string[]): Promise<void> {
  const package_dir = dirname(fileURLToPath(import.meta.resolve("oxlint/package.json")))
  const args = [join(package_dir, "bin/oxlint"), "--format", "stylish", ...dirs]
  if (argv.fix) {
    args.push("--fix")
  }
  const child = spawn(process.execPath, args, {stdio: "inherit"})
  await new Promise<void>((resolve, reject) => {
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new BuildError("lint", "lint failed with Oxlint"))
      }
    })
  })
}

const test_subdirs = [
  "framework",
  "defaults",
  "unit",
  "integration",
  "codebase",
  "devtools",
  "frameworks",
]

// Type-aware rules need the declarations referenced by test and workspace
// tsconfigs, even when lint is the first command after npm ci.
task("lint:prepare", ["frameworks:compile", "test:framework:compile"])

for (const name of test_subdirs) {
  task(`eslint:test:${name}`, ["lint:prepare"], async () => await lint([join(paths.src_dir.test, name)]))
}

task("eslint:make", async () => await lint([paths.make_dir]))
task("eslint:lib", ["scripts:compile"], async () => await lint([paths.src_dir.lib]))
task("eslint:compiler", async () => await lint([paths.src_dir.compiler]))
task("eslint:server", ["scripts:compile"], async () => await lint([paths.src_dir.server]))
task("eslint:test", ["lint:prepare"], async () => await lint(test_subdirs.map((name) => join(paths.src_dir.test, name))))
task("eslint:examples", ["frameworks:compile"], async () => await lint([paths.src_dir.examples]))
task("eslint:frameworks", ["frameworks:compile"], async () => await lint([join(paths.base_dir, "frameworks")]))
task("eslint:examples:frameworks", ["frameworks:compile"], async () => await lint([join(paths.src_dir.examples, "frameworks")]))

task("oxlint", ["lint:prepare"], async () => await lint([
  paths.make_dir,
  paths.src_dir.lib,
  paths.src_dir.compiler,
  paths.src_dir.server,
  ...test_subdirs.map((name) => join(paths.src_dir.test, name)),
  paths.src_dir.examples,
  join(paths.base_dir, "frameworks"),
]))

// Keep the existing task names usable by contributor scripts.
task("eslint", ["oxlint"])
task("lint", ["oxlint"])
