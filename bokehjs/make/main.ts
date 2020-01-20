import chalk from "chalk"
import yargs = require("yargs")

const {argv} = yargs.help(false)

import {run, log, task_names, Result, failure} from "./task"
import "./tasks"

const {_} = argv

async function main(): Promise<void> {
  if (_.length != 0 && _[0] == "help")
    log("tasks: " + task_names().filter((name) => !name.includes(":")).join(", "))
  else {
    const tasks = _.length != 0 ? _ : ["default"]

    let result: Result
    try {
      result = await run(...tasks)
    } catch (error) {
      result = failure(error)
    }

    if (result.is_Failure()) {
      const error = result.value
      log(`${chalk.red("failed:")} ${error.message}`)
      if (error.stack != null) {
        const lines = error.stack.split("\n")
        for (const line of lines) {
          if (line.match(/^\s+at\s+/)) {
            log(line)
          }
        }
      }
      process.exit(1)
    }
  }

  process.exit(0)
}

main() // TODO: top-level await (TS 3.8)
