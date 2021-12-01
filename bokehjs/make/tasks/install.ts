import {spawn} from "child_process"
import chalk from "chalk"

import {task, log, BuildError} from "../task"

function output_line(line: string) {
  const prefix = chalk.cyan("setup.py:")
  log(`${prefix} ${chalk.grey(line)}`)
}

function handle_output(data: string) {
  `${data}`.replace(/\s*$/, "")
    .split("\n")
    .forEach(output_line)
}

task("install", ["build"], () => {
  // installs js and css
  // note: sets cwd as parent dir so that LICENSE.txt is accessible to setup.py
  const proc = spawn("python", ["setup.py", "--install-js"], {cwd: "../"})
  proc.stdout.on("data", handle_output)
  proc.stderr.on("data", handle_output)
  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("exit", (code) => {
      if (code === 0) {
        output_line("DONE!")
        resolve()
      } else {
        reject(new BuildError("setup.py", `setup.py exited code ${code}`))
      }
    })
  })
})
