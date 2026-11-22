import crypto from "node:crypto"
import fs from "node:fs"
import {parse, format, basename, dirname, join} from "node:path"

export type Path = string

export function scan(path: Path, extensions: readonly string[]): Path[] {
  const patterns = extensions.map((ext) => `**/*${ext}`)
  return fs.globSync(patterns, {cwd: path}).sort().map((file) => join(path, file))
}

export function read(path: Path): string | undefined {
  let data: string
  try {
    data = fs.readFileSync(path, "utf8")
  } catch {
    return undefined
  }
  return data.startsWith("﻿") ? data.slice(1) : data
}

export function write(path: Path, data: string): void {
  fs.mkdirSync(dirname(path), {recursive: true})
  fs.writeFileSync(path, data)
}

function stat(path: Path): fs.Stats | undefined {
  try {
    return fs.statSync(path, {throwIfNoEntry: false})
  } catch {
    return undefined
  }
}

export function file_exists(path: Path): boolean {
  return stat(path)?.isFile() ?? false
}

export function directory_exists(path: Path): boolean {
  return stat(path)?.isDirectory() ?? false
}

export type RenameOptions = {
  base?: string
  dir?: string
  name?: (name: string) => string
  ext?: string
}

export function rename(path: string, options: RenameOptions): string {
  let {dir, name, ext} = parse(path)
  if (options.dir != null) {
    if (options.base != null) {
      dir = dir.replace(options.base, options.dir)
    } else {
      dir = options.dir
    }
  }
  if (options.name != null) {
    name = options.name(name)
  }
  if (options.ext != null) {
    ext = options.ext
  }
  return format({dir, name, ext})
}

export function hash(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex")
}

export function hash_file(path: Path): string | null {
  const contents = read(path)
  return contents != null ? hash(contents) : null
}

export function read_json(path: Path): unknown | undefined {
  const data = read(path)
  if (data == null) {
    return undefined
  } else {
    try {
      return JSON.parse(data)
    } catch {
      return undefined
    }
  }
}

function npm_bin_dir(): string {
  // directory containing npm-cli.js and npx-cli.js
  const execpath = process.env.npm_execpath
  if (execpath != null && ["npm-cli.js", "npx-cli.js"].includes(basename(execpath))) {
    return dirname(execpath)
  }
  return join(dirname(process.execPath), "node_modules", "npm", "bin")
}

export function resolve_npm(args: string[]): [string, string[]] {
  if (process.platform == "win32") {
    return [process.execPath, [join(npm_bin_dir(), "npm-cli.js"), ...args]]
  }
  return ["npm", args]
}

export function resolve_npx(args: string[]): [string, string[]] {
  if (process.platform == "win32") {
    return [process.execPath, [join(npm_bin_dir(), "npx-cli.js"), ...args]]
  }
  return ["npx", args]
}
