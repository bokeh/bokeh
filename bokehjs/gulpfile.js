const crypto = require("crypto")
const semver = require("semver")
const cp = require("child_process")
const fs = require("fs")

const {engines} = require("./package.json")

const node_version = process.version
const npm_version = cp.execSync("npm --version").toString().trim()

if (!semver.satisfies(node_version, engines.node)) {
  console.log(`node ${engines.node} is required. Current version is ${node_version}.`)
  process.exit(1)
}

if (!semver.satisfies(npm_version, engines.npm)) {
  console.log(`npm ${engines.npm} is required. Current version is ${npm_version}.`)
  process.exit(1)
}

function is_up_to_date(file) {
  const hash_file = "." + file

  if (!fs.existsSync(hash_file))
    return false

  const old_hash = fs.readFileSync(hash_file)

  const new_hash = crypto.createHash("sha256")
                         .update(fs.readFileSync(file))
                         .digest("hex")

  return old_hash == new_hash
}

if (!is_up_to_date("package.json")) {
  console.log("package.json has changed. Run `npm install`.")
  process.exit(1)
}

require("./ts-node").register({project: "./gulp/tsconfig.json", cache: false});
require("./gulp");
