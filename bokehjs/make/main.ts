import yargs = require("yargs")

const {argv} = yargs.help(false)

import {run, log, task_names, Result, failure, show_failure} from "./task"
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
      show_failure(result)
      process.exit(1)
    }
  }

  process.exit(0)
}

main() // TODO: top-level await (TS 3.8)
