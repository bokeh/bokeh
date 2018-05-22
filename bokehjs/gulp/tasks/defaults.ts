import {spawn} from "child_process"
import * as path from "path"

import {task, log} from "../task"
import {build_dir} from "../paths"

task("defaults:generate", () => {
  const bokehjsdir = path.normalize(process.cwd())
  const basedir = path.normalize(bokehjsdir + "/..")
  const oldpath = process.env['PYTHONPATH']
  const pypath = oldpath != null ? `${basedir}${path.delimiter}${oldpath}` : basedir
  const env = {...process.env, PYTHONPATH: pypath}
  const script = path.join(__dirname, 'generate_defaults.py')
  const proc = spawn("python", [script, build_dir.test], {
    env: env,
    cwd: bokehjsdir,
  })
  proc.stdout.on("data", (data) => {
    ("" + data)
      .split('\n')
      .filter((line) => line.trim().length != 0)
      .forEach((line) => log(`generate_defaults.py: ${line}`))
  })
  proc.stderr.on("data", (data) => {
    log(`generate_defaults.py: ${data}`)
  })
  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("exit", (code) => {
      if (code === 0)
        resolve()
      else
        reject(new Error(`generate_defaults.py exited code ${code}`))
    })
  })
})
