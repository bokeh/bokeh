import * as path from "path"
import * as child_process from "child_process"
import * as gulp from "gulp"
import * as gutil from "gulp-util"
import {argv} from "yargs"

gulp.task("defaults:generate", (cb: (arg?: any) => void) => {
  if (argv.verbose) {
    gutil.log("Generating defaults.coffee")
  }

  const bokehjsdir = path.normalize(process.cwd())
  const basedir = path.normalize(bokehjsdir + "/..")
  const oldpath = process.env['PYTHONPATH']
  const pypath = oldpath != null ? `${basedir}:${oldpath}` : basedir
  const env = Object.assign({}, process.env, {PYTHONPATH: pypath})
  const handle = child_process.spawn("python", ['./gulp/tasks/generate_defaults.py', './test/'], {
    env: env,
    cwd: bokehjsdir
  })
  handle.stdout.on("data", (data) => {
    ("" + data)
      .split('\n')
      .filter((line) => line.trim().length != 0)
      .forEach((line) => gutil.log(`generate_defaults.py: ${line}`))
  })
  handle.stderr.on("data", (data) => {
    gutil.log(`generate_defaults.py: ${data}`)
  })
  handle.on("close", (code) => {
    if(code != 0)
      cb(new Error(`generate_defaults.py exited code ${code}`))
    else
      cb()
  })
})
