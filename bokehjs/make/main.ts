import cp from "node:child_process"

import semver from "semver"
import chalk from "chalk"
const {magenta} = chalk

import {argv} from "./args.js"

import {task, run, log, task_names, show_error, show_failure} from "./task.js"
import "./tasks/index.js"

function node_version(): string {
  return process.version
}

function npm_version(): string {
  return cp.execSync("npm --version").toString().trim()
}

type PackageJson = {
  engines: {
    node: string
    npm: string
  }
}

export async function main(pkg_json: PackageJson): Promise<void> {
  const version = {
    node: node_version(),
    npm: npm_version(),
  }

  log(`Using nodejs ${magenta(version.node)} and npm ${magenta(version.npm)}`)

  if (!semver.satisfies(version.node, pkg_json.engines.node)) {
    console.error(`node ${pkg_json.engines.node} is required. Current version is ${version.node}.`)
    process.exit(1)
  }

  if (!semver.satisfies(version.npm, pkg_json.engines.npm)) {
    console.error(`npm ${pkg_json.engines.npm} is required. Current version is ${version.npm}.`)
    process.exit(1)
  }

  const {_} = argv
  if (_.length != 0 && _[0] == "help") {
    log(`tasks: ${task_names().filter((name) => !name.includes(":")).join(", ")}`)
  } else {
    const tasks = _.length != 0 ? _.map((arg) => `${arg}`) : ["default"]
    const top_level = task("top-level", tasks)

    try {
      const result = await run(top_level)
      if (result.is_Failure()) {
        show_failure(result)
        process.exit(1)
      }
    } catch (error) {
      show_error(error)
      process.exit(1)
    }
  }

  process.exit(0)
}
