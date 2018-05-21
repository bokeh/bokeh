import {spawn} from "child_process"
import * as path from "path"
import * as gulp from "gulp"
import * as gutil from "gulp-util"

import {build_dir} from "../paths"

gulp.task("defaults:generate", () => {
  const bokehjsdir = path.normalize(process.cwd())
  const basedir = path.normalize(bokehjsdir + "/..")
  const oldpath = process.env['PYTHONPATH']
  const pypath = oldpath != null ? `${basedir}${path.delimiter}${oldpath}` : basedir
  const env = {...process.env, PYTHONPATH: pypath}
  const proc = spawn("python", ['./gulp/tasks/generate_defaults.py', build_dir.test], {
    env: env,
    cwd: bokehjsdir,
  })
  proc.stdout.on("data", (data) => {
    ("" + data)
      .split('\n')
      .filter((line) => line.trim().length != 0)
      .forEach((line) => gutil.log(`generate_defaults.py: ${line}`))
  })
  proc.stderr.on("data", (data) => {
    gutil.log(`generate_defaults.py: ${data}`)
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
