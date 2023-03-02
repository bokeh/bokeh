import cp from "child_process"
import fs from "fs"
import path from "path"
import {task, BuildError} from "../task"

function npm_pack() {
  const dist = "build/dist"
  if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist, {recursive: true})
  }

  const npm = process.platform != "win32" ? "npm" : "npm.cmd"
  const {status, stdout, stderr} = cp.spawnSync(npm, ["pack", `--pack-destination=${dist}`], {stdio: "pipe", encoding: "utf-8"})
  if (status !== 0) {
    console.error(stdout)
    console.error(stderr)
    throw new BuildError("pack", `failed to run '${npm} pack'`)
  }

  const tgz = stdout.trim()
  if (!tgz.endsWith(".tgz")) {
    throw new BuildError("pack", "can't find tgz archive name in the output")
  }

  const tgz_latest = path.join(dist, "bokeh-bokehjs.tgz")
  if (fs.existsSync(tgz_latest)) {
    fs.unlinkSync(tgz_latest)
  }

  fs.symlinkSync(tgz, tgz_latest)
}

task("pack", async () => {
  npm_pack()
})
