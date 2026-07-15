import {task, run, log} from "../task.js"
import {keep_alive, debounce} from "./_util.js"

import {build_scripts} from "./build.js"
import {build_defaults, build_unit, build_integration} from "./test.js"

import * as paths from "../paths.js"
import {argv} from "../args.js"

import chokidar from "chokidar"
import chalk from "chalk"

task("watch", [], async () => {
  const watched_paths = new Map([
    [paths.src_dir.less, build_scripts], // build_styles
    [paths.src_dir.lib, build_scripts],
    [paths.src_dir.grammar, build_scripts],
    [paths.test_dir.defaults, build_defaults],
    [paths.test_dir.unit, build_unit],
    [paths.test_dir.integration, build_integration],
  ])

  log("Watching paths:")
  for (const [watched_path, task] of watched_paths) {
    const path = watched_path.replace(paths.base_dir, "")
    log(`  ${chalk.magenta(path)} -> ${chalk.cyan(task.name)}`)
  }

  const watcher = chokidar.watch([...watched_paths.keys()], {
    persistent: true,
  })

  watcher.on("change", debounce(async (files: [string][]) => {
    const changed_paths = new Map([...watched_paths].map(([path, task]) => [path, {changed: false, task}]))

    for (const [file] of files) {
      if (argv.verbose) {
        log(file)
      }
      for (const [path, metadata] of changed_paths) {
        if (file.includes(path)) {
          metadata.changed = true
          break
        }
      }
    }

    log("Changes detected. Rebuilding.")
    for (const [_, {changed, task}] of changed_paths) {
      if (changed) {
        await run(task)
      }
    }
  }, 100))

  await keep_alive()
})
