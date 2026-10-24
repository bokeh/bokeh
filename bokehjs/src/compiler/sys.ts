import crypto from "node:crypto"
import fs from "node:fs"
import {dirname, join, parse, format, basename} from "node:path"

export type Path = string

export function scan(path: string, extensions?: readonly string[]): string[] {
  if (!directory_exists(path)) {
    return []
  }
  return fs.readdirSync(path, {recursive: true, encoding: "utf8"})
    .map((file) => join(path, file))
    .filter((file) => file_exists(file) && (extensions == null || extensions.some((ext) => file.endsWith(ext))))
    .sort()
}

export function read(path: string): string | undefined {
  try {
    return fs.readFileSync(path, "utf8").replace(/^\uFEFF/, "")
  } catch {
    return undefined
  }
}

export function write(path: string, data: string): void {
  fs.mkdirSync(dirname(path), {recursive: true})
  fs.writeFileSync(path, data)
}

export function file_exists(path: string): boolean {
  return fs.statSync(path, {throwIfNoEntry: false})?.isFile() ?? false
}

export function directory_exists(path: string): boolean {
  return fs.statSync(path, {throwIfNoEntry: false})?.isDirectory() ?? false
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
  // Python's compiler subprocess restricts PATH and supplies the discovered CLI.
  const cli = process.env.BOKEH_NPMJS_PATH
  if (cli != null) {
    return [process.execPath, [cli, ...args]]
  }
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
