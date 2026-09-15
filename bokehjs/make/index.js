import crypto from "node:crypto"
import cp from "node:child_process"
import fs from "node:fs"
import {join, dirname, basename} from "node:path"

function npm_install() {
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
  const hash_file = "make/_build/.compile-hash"
  const outputs = ["make/_build/make/main.js", "make/_build/src/compiler/sys.js"]

  function source_files(dir) {
    const files = []
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name != "_build" && entry.name != "node_modules") {
          files.push(...source_files(path))
        }
      } else {
        files.push(path)
      }
    }
    return files
  }

  const inputs = [...new Set([
    "package.json",
    "package-lock.json",
    "tsconfig.base.json",
    ...source_files("make"),
    ...source_files("src/compiler"),
  ])].sort()

  const hash = crypto.createHash("sha256")
  for (const input of inputs) {
    hash.update(input)
    hash.update("\0")
    hash.update(fs.readFileSync(input))
    hash.update("\0")
  }
  const digest = hash.digest("hex")

  if (outputs.every((output) => fs.existsSync(output)) &&
      fs.existsSync(hash_file) && fs.readFileSync(hash_file, "utf8") == digest) {
    return
  }

  const is_windows = process.platform == "win32"
  const npx = is_windows ? "npx.cmd" : "npx"
  const {status} = cp.spawnSync(npx, ["--loglevel=warn", "tsc", "--project", "./make/tsconfig.json"], {stdio: "inherit", shell: is_windows})
  if (status !== 0) {
    process.exit(status ?? 1)
  }

  fs.writeFileSync(hash_file, digest)
}

compile()

const {main} = await import("./_build/make/main.js")
void main(pkg_json)
