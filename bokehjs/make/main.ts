import yargs from "yargs"
import cp from "child_process"

import chalk from "chalk"
const {magenta} = chalk

export const argv = yargs.help(false).options({
  // paths
  "build-dir": {type: "string"},
  // lint
  fix: {type: "boolean", default: false},
  // scripts, compiler
  cache: {type: "boolean", default: true},
  // scripts, compiler, test
  rebuild: {type: "boolean", default: false},
  // scripts
  detectCycles: {type: "boolean", default: true},
  // server, test
  host: {type: "string", default: "127.0.0.1"},
  // server
  port: {type: "number", default: 5877},
  inspect: {type: "boolean", default: false},
  // test
  executable: {type: "string", alias: "e"},
  debug: {type: "boolean", default: false},
  keyword: {type: "string", array: true, alias: "k"},
  grep: {type: "string", array: true},
  ref: {type: "string"},
  "baselines-root": {type: "string"},
  randomize: {type: "boolean"},
  seed: {type: "number"},
  pedantic: {type: "boolean"},
  screenshot: {type: "string", choices: ["test", "save", "skip"] as const, default: "test"},
}).parseSync()

import {task, run, log, task_names, show_error, show_failure} from "./task"
import "./tasks"

const node_version = process.version

function npm_version(): string {
  return cp.execSync("npm --version").toString().trim()
}

async function main(): Promise<void> {
  log(`Using nodejs ${magenta(node_version)} and npm ${magenta(npm_version())}`)
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

void main()
