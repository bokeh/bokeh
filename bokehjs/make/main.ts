import chalk from "chalk"
import yargs = require("yargs")

const {argv} = yargs.help(false)

import {run, log, task_names} from "./task"
import "./tasks"

const {_} = argv

if (_.length != 0 && _[0] == "help")
  log("tasks: " + task_names().filter((name) => !name.includes(":")).join(", "))
else {
  const tasks = _.length != 0 ? _ : ["default"]

  run(...tasks).catch((err) => {
    const [first, ...rest] = err.stack.split("\n")
    log(`${chalk.red("failed:")} ${first}`)
    for (const line of rest)
      log(line)
    process.exit(1)
  })
}
