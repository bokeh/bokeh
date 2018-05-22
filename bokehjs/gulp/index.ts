import chalk from "chalk"
import {argv} from "yargs"

import {run, log} from "./task"

import "./tasks"

const {_} = argv

let task: string
switch (_.length) {
  case 0:
    task = "default"
    break
  case 1:
    task = _[0]
    break
  default:
    throw new Error("expected one positional argument")
}

run(task).catch((err) => {
  log(`${chalk.red("failed:")} ${err.message}`)
  process.exit(1)
})
