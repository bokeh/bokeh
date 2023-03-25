import del from "del"

import {task} from "../task"
import {build_dir} from "../paths"

task("clean:all", async () => {
  await del(build_dir.all)
})

task("clean:scripts", async () => {
  await del(build_dir.js)
})

task("clean:styles", async () => {
  await del(build_dir.css)
})

task("clean", ["clean:scripts", "clean:styles"])
