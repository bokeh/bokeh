import assert from "node:assert"
import os from "node:os"
import fs from "node:fs"
import cp from "node:child_process"
import type {ChildProcess} from "node:child_process"
import {Socket} from "node:net"

import {BuildError} from "../task.js"

export const platform = (() => {
  switch (os.type()) {
    case "Linux":      return "linux"
    case "Darwin":     return "macos"
    case "Windows_NT": return "windows"
    default:
      throw new Error(`unsupported platform: ${os.type()}`)
  }
})()

export const is_dir = (path: string) => fs.lstatSync(path).isDirectory()
export const is_file = (path: string) => fs.lstatSync(path).isFile()
export const exists = (path: string) => fs.existsSync(path)
export const file_exists = (path: string) => exists(path) && is_file(path)
export const dir_exists = (path: string) => exists(path) && is_dir(path)

export function compile_typescript(tsconfig_path: string): void {
  const is_windows = process.platform == "win32"
  const npx = is_windows ? "npx.cmd" : "npx"
  const {status} = cp.spawnSync(npx, ["tsgo", "--project", tsconfig_path], {stdio: "inherit", shell: is_windows})
  if (status != 0) {
    throw new BuildError("typescript", "compilation failed with tsgo")
  }
}

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

// Based on https://underscorejs.org/docs/modules/debounce.html
type DebouncedFn<Args extends unknown[]> = {
  (...args: Args): Promise<void>
  stop(): void
}

export function clear(array: unknown[]): void {
  array.splice(0, array.length)
}

export function debounce<Args extends unknown[]>(func: (args: Args[]) => Promise<void>, wait: number, immediate: boolean = false): DebouncedFn<Args> {
  let timeout: NodeJS.Timeout | null = null
  let previous: number
  const collected: Args[] = []

  const later = async () => {
    const passed = Date.now() - previous
    if (wait > passed) {
      timeout = setTimeout(later, wait - passed)
    } else {
      timeout = null
      if (!immediate) {
        await func(collected)
        clear(collected)
      }
    }
  }

  const debounced = async (...args: Args) => {
    previous = Date.now()
    collected.push(args)
    if (timeout == null) {
      timeout = setTimeout(later, wait)
      if (immediate) {
        await func(collected)
        clear(collected)
      }
    }
  }

  debounced.stop = function() {
    if (timeout != null) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return debounced
}
