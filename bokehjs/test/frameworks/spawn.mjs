import {basename, dirname, join} from "node:path"

function npm_bin_dir() {
  // directory containing npm-cli.js and npx-cli.js
  const execpath = process.env.npm_execpath
  if (execpath != null && ["npm-cli.js", "npx-cli.js"].includes(basename(execpath))) {
    return dirname(execpath)
  }
  return join(dirname(process.execPath), "node_modules", "npm", "bin")
}

export function resolve_executable(executable, args) {
  if (process.platform == "win32") {
    switch (executable) {
      case "node":
        return [process.execPath, args]
      case "npm":
        return [process.execPath, [join(npm_bin_dir(), "npm-cli.js"), ...args]]
      case "npx":
        return [process.execPath, [join(npm_bin_dir(), "npx-cli.js"), ...args]]
    }
  }
  return [executable, args]
}
