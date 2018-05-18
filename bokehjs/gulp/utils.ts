import * as ts from "typescript"
import * as path from "path"

export const read = ts.sys.readFile
export const write = ts.sys.writeFile

export function rename(p: string, options: {ext?: string}): string {
  let {dir, name, ext} = path.parse(p)
  if (options.ext != null)
    ext = options.ext
  return path.format({dir, name, ext})
}
