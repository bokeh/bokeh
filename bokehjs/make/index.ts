import crypto from "crypto"
import cp from "child_process"
import fs from "fs"
import {join, dirname, basename} from "path"

function npm_install(): void {
  const is_windows = process.platform == "win32"
  const npm = is_windows ? "npm.cmd" : "npm"
  const {status} = cp.spawnSync(npm, ["install"], {stdio: "inherit", shell: is_windows})
  if (status !== 0) {
    process.exit(status)
  }
}

if (!fs.existsSync("node_modules/")) {
  console.log("New development environment. Running `npm install`.")
  npm_install()
}

import pkg from "../package.json" with {type: "json"}

const node_version = process.version
const npm_version = cp.execSync("npm --version").toString().trim()

import semver from "semver"

if (!semver.satisfies(node_version, pkg.engines.node)) {
  console.log(`node ${pkg.engines.node} is required. Current version is ${node_version}.`)
  process.exit(1)
}

if (!semver.satisfies(npm_version, pkg.engines.npm)) {
  console.log(`npm ${pkg.engines.npm} is required. Current version is ${npm_version}.`)
  process.exit(1)
}

function is_up_to_date(file: string): boolean {
  const hash_file = join(dirname(file), `.${basename(file)}`)

  if (!fs.existsSync(hash_file)) {
    return false
  }

  const old_hash = fs.readFileSync(hash_file, {encoding: "utf-8"})

  const new_hash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(file))
    .digest("hex")

  return old_hash == new_hash
}

for (const workspace of ["", ...pkg.workspaces]) {
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

import "./main.ts"
