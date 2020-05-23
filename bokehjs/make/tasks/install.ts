import {spawn} from "child_process"
import chalk from "chalk"

import {task, log, BuildError} from "../task"

function outputLine(line: string) {
  const prefix = chalk.cyan("setup.py:")
  log(`${prefix} ${chalk.grey(line)}`)
}

function handleOutput(data: string) {
  ("" + data).replace(/\s*$/, "")
    .split("\n")
    .forEach(outputLine)
}

task("install", ["build"], () => {
  // installs js and css
  // note: sets cwd as parent dir so that LICENSE.txt is accessible to setup.py
  const proc = spawn("python", ["setup.py", "--install-js"], {cwd: "../"})
  proc.stdout!.on("data", handleOutput)
  proc.stderr!.on("data", handleOutput)
  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("exit", (code) => {
      if (code === 0) {
        outputLine("DONE!")
        resolve()
      } else {
        reject(new BuildError("setup.py", `setup.py exited code ${code}`))
      }
    })
  })
})
