import {spawn} from "child_process"
import {join} from "path"

import {task, log, BuildError} from "../task"
import {build_dir} from "../paths"

task("defaults:generate", () => {
  const script = join(__dirname, "generate_defaults.py")
  const proc = spawn("python", [script, build_dir.test], {stdio: "pipe"})
  proc.stdout.on("data", (data) => {
    `${data}`
      .split("\n")
      .filter((line) => line.trim().length != 0)
      .forEach((line) => log(line))
  })
  proc.stderr.on("data", (data) => {
    log(`${data}`)
  })
  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("exit", (code) => {
      if (code === 0)
        resolve()
      else
        reject(new BuildError("defaults", `generate_defaults.py exited code ${code}`))
    })
  })
})
