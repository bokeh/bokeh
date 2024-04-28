import cp from "child_process"
import fs from "fs"
import os from "os"
import path from "path"
import {task, BuildError} from "../task"

function npm_pack() {
  const dist = "build/dist"
  if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist, {recursive: true})
  }

  const is_windows = process.platform == "win32"
  const npm = is_windows ? "npm.cmd" : "npm"
  const {status, stdout, stderr} = cp.spawnSync(npm, ["pack", `--pack-destination=${dist}`], {stdio: "pipe", encoding: "utf-8", shell: is_windows})
  if (status !== 0) {
    console.error(stdout)
    console.error(stderr)
    throw new BuildError("pack", `failed to run '${npm} pack'`)
  }

  const tgz = stdout.trim().split("\n").at(-1)?.trim()
  if (tgz == null || !tgz.endsWith(".tgz")) {
    throw new BuildError("pack", "can't find tgz archive name in the output")
  }

  const tgz_latest = path.join(dist, "bokeh-bokehjs.tgz")
  if (fs.existsSync(tgz_latest)) {
    fs.unlinkSync(tgz_latest)
  }

  try {
    fs.symlinkSync(tgz, tgz_latest)
  } catch (error: unknown) {
    if (error instanceof Error) {
      const e = error as NodeJS.ErrnoException
      if (e.errno === os.constants.errno.EPERM) {
        fs.copyFileSync(tgz, tgz_latest)
      }
    }
  }
}

task("pack", async () => {
  npm_pack()
})
