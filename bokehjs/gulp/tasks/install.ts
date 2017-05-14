import {spawn} from "child_process"
import * as gulp from "gulp"
import * as gutil from "gulp-util"

function outputLine(line: string) {
  const prefix = gutil.colors.cyan("setup.py:")
  gutil.log(`${prefix} ${gutil.colors.grey(line)}`)
}

function handleOutput(data: string) {
  data.replace(/\s*$/, "")
    .split("\n")
    .forEach(outputLine)
}

gulp.task("install", () => {
  // installs js and css
  // note: sets cwd as parent dir so that LICENSE.txt is accessible to setup.py
  const setup = spawn("python", ["setup.py", "--install-js"], {cwd: "../"})
  setup.stdout.setEncoding("utf8")
  setup.stdout.on("data", handleOutput)
  setup.stderr.setEncoding("utf8")
  setup.stderr.on("data", handleOutput)
  setup.on("exit", () => {
    outputLine("DONE!")
  })
})
