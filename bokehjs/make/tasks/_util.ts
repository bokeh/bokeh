import assert from "assert"
import os from "os"
import type {ChildProcess} from "child_process"
import {Socket} from "net"

import {BuildError} from "../task"

export const platform = (() => {
  switch (os.type()) {
    case "Linux":      return "linux"
    case "Darwin":     return "macos"
    case "Windows_NT": return "windows"
    default:
      throw new Error(`unsupported platform: ${os.type()}`)
  }
})()

export async function is_available(port: number): Promise<boolean> {
  const host = "0.0.0.0"
  const timeout = 10000

  return new Promise((resolve, reject) => {
    const socket = new Socket()
    let available = false
    let failure = false

    socket.on("connect", () => {
      socket.destroy()
    })

    socket.setTimeout(timeout)
    socket.on("timeout", () => {
      failure = true
      socket.destroy()
    })

    socket.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "ECONNREFUSED") {
        available = true
      }
    })

    socket.on("close", () => {
      if (!failure) {
        resolve(available)
      } else {
        reject(new BuildError("net", "timeout when searching for unused port"))
      }
    })

    socket.connect(port, host)
  })
}

export async function find_port(port: number): Promise<number> {
  while (!await is_available(port)) {
    port++
  }
  return port
}

export async function retry(fn: () => Promise<void>, attempts: number): Promise<void> {
  assert(attempts > 0)
  while (true) {
    if (--attempts == 0) {
      await fn()
      break
    } else {
      try {
        await fn()
        break
      } catch {}
    }
  }
}

export function terminate(proc: ChildProcess): void {
  process.once("exit",    () => proc.kill())
  process.once("SIGINT",  () => proc.kill("SIGINT"))
  process.once("SIGTERM", () => proc.kill("SIGTERM"))
}

export async function keep_alive(): Promise<void> {
  await new Promise((resolve) => {
    process.on("SIGINT", () => resolve(undefined))
  })
}
