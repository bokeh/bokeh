import * as ts from "typescript"
import {parse, format, normalize} from "path"

export function scan(path: string,
    extensions?: readonly string[], exclude?: readonly string[], include?: readonly string[], depth?: number): string[] {
  return ts.sys.readDirectory(path, extensions, exclude, include, depth).map((p) => normalize(p))
}

export const read = ts.sys.readFile
export const write = ts.sys.writeFile

export const fileExists = ts.sys.fileExists
export const directoryExists = ts.sys.directoryExists

export function rename(path: string, options: {base?: string, dir?: string, ext?: string}): string {
  let {dir, name, ext} = parse(path)
  if (options.dir != null) {
    if (options.base != null)
      dir = dir.replace(options.base, options.dir)
    else
      dir = options.dir
  }
  if (options.ext != null)
    ext = options.ext
  return format({dir, name, ext})
}
