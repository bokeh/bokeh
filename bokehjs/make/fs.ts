import * as ts from "typescript"
import * as path from "path"

export const scan = ts.sys.readDirectory

export const read = ts.sys.readFile
export const write = ts.sys.writeFile

export const fileExists = ts.sys.fileExists
export const directoryExists = ts.sys.directoryExists

export function rename(p: string, options: {dir?: string, ext?: string}): string {
  let {dir, name, ext} = path.parse(p)
  if (options.dir != null)
    dir = options.dir
  if (options.ext != null)
    ext = options.ext
  return path.format({dir, name, ext})
}
