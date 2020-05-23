import yargs = require("yargs")

const {argv} = yargs.help(false)

import {task, run, log, task_names, show_error, show_failure} from "./task"
import "./tasks"

const {_} = argv

async function main(): Promise<void> {
  if (_.length != 0 && _[0] == "help")
    log("tasks: " + task_names().filter((name) => !name.includes(":")).join(", "))
  else {
    const tasks = _.length != 0 ? _ : ["default"]
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

main()
