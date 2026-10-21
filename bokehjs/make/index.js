import crypto from "node:crypto"
import cp from "node:child_process"
import fs from "node:fs"
import {join, dirname, basename} from "node:path"

function npm_bin_dir() {
  // directory containing npm-cli.js and npx-cli.js
  const execpath = process.env.npm_execpath
  if (execpath != null && ["npm-cli.js", "npx-cli.js"].includes(basename(execpath))) {
    return dirname(execpath)
  }
  return join(dirname(process.execPath), "node_modules", "npm", "bin")
}

function resolve_npm(args) {
  if (process.platform == "win32") {
    return [process.execPath, [join(npm_bin_dir(), "npm-cli.js"), ...args]]
  }
  return ["npm", args]
}

function resolve_npx(args) {
  if (process.platform == "win32") {
    return [process.execPath, [join(npm_bin_dir(), "npx-cli.js"), ...args]]
  }
  return ["npx", args]
}

function npm_install() {
  const [resolved_executable, resolved_args] = resolve_npm(["install"])
  const {status, error} = cp.spawnSync(resolved_executable, resolved_args, {stdio: "inherit"})
  if (error != null) {
    console.error(`${resolved_executable} ${resolved_args.join(" ")} failed to start: ${error.message}`)
    process.exit(1)
  }
  if (status !== 0) {
    process.exit(status ?? 1)
  }
}

if (!fs.existsSync("node_modules/")) {
  console.log("New development environment. Running `npm install`.")
  npm_install()
}

import pkg_json from "../package.json" with {type: "json"}
const {workspaces} = pkg_json

function is_up_to_date(file) {
  const hash_file = join(dirname(file), `.${basename(file)}`)

  if (!fs.existsSync(hash_file)) {
    return false
  }

  const old_hash = fs.readFileSync(hash_file)

  const new_hash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(file))
    .digest("hex")

  return old_hash == new_hash
}

for (const workspace of ["", ...workspaces]) {
  const path = join(workspace, "package.json")
  if (!is_up_to_date(path)) {
    console.log(`${path} has changed. Running 'npm install'.`)
    npm_install()
    break
  }
}

process.on("uncaughtException", function(err) {
  console.error(err)
  process.exit(1)
})

function compile() {
  const [resolved_executable, resolved_args] = resolve_npx(["--loglevel=warn", "tsc", "--project", "./make/tsconfig.json"])
  const {status, error} = cp.spawnSync(resolved_executable, resolved_args, {stdio: "inherit"})
  if (error != null) {
    console.error(`${resolved_executable} ${resolved_args.join(" ")} failed to start: ${error.message}`)
    process.exit(1)
  }
  if (status !== 0) {
    process.exit(status ?? 1)
  }
}

compile()

const {main} = await import("./_build/make/main.js")
void main(pkg_json)
