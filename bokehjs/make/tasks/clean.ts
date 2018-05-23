import * as del from "del"

import {task} from "../task"
import {build_dir} from "../paths"

task("clean", ["clean:scripts", "clean:styles"])

task("clean:all", () => {
  return del(build_dir.all)
})

task("clean:scripts", () => {
  return del(build_dir.js)
})

task("clean:styles", () => {
  return del(build_dir.css)
})
