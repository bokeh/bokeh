import cp from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {task, BuildError} from "../task.js"
import {resolve_npm} from "#compiler/sys.js"

function npm_pack() {
  const dist = "build/dist"
  if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist, {recursive: true})
  }

  const [resolved_executable, resolved_args] = resolve_npm(["pack", `--pack-destination=${dist}`])
  const {status, error, stdout, stderr} = cp.spawnSync(resolved_executable, resolved_args, {stdio: "pipe", encoding: "utf-8"})
  if (error != null || status !== 0) {
    console.error(stdout)
    console.error(stderr)
    const reason = error != null ? `: ${error.message}` : ""
    throw new BuildError("pack", `failed to run '${resolved_executable} ${resolved_args.join(" ")}'${reason}`)
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
