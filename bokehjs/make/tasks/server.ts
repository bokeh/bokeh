import type {ChildProcess} from "child_process"
import {spawn} from "child_process"

import {argv} from "../main"
import {task, task2, success, BuildError} from "../task"
import {find_port, retry, terminate, keep_alive} from "./_util"

async function server(host?: string, port?: number, inspect?: boolean): Promise<ChildProcess> {
  const args = ["--no-warnings", "./src/server", "server"]

  if (host != null) {
    args.push(`--host=${host}`)
  }
  if (port != null) {
    args.push(`--port=${port}`)
  }
  if (inspect ?? false) {
    args.unshift("--inspect")
  }

  const proc = spawn(process.execPath, args, {stdio: ["inherit", "inherit", "inherit", "ipc"]})
  terminate(proc)

  return new Promise((resolve, reject) => {
    proc.on("error", reject)
    proc.on("message", (msg) => {
      if (msg == "ready") {
        resolve(proc)
      } else {
        reject(new BuildError("bokehjs-server", "failed to start"))
      }
    })
    proc.on("exit", (code, _signal) => {
      if (code !== 0) {
        reject(new BuildError("bokehjs-server", "failed to start"))
      }
    })
  })
}

const {host, port, inspect} = argv

task("run:server", async () => {
  await server(host, port, inspect)
  await keep_alive()
})

export const start_server = task2("start:server", [], async () => {
  let use_port = port
  await retry(async () => {
    use_port = await find_port(use_port)
    await server(host, use_port, inspect)
  }, 3)
  return success(use_port)
})
