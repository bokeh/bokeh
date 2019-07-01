const crypto = require("crypto")
const cp = require("child_process")
const fs = require("fs")

function npm_install() {
  const {status} = cp.spawnSync("npm", ["install"], {stdio: "inherit"})
  if (status !== 0)
    process.exit(status)
}

if (!fs.existsSync("node_modules/")) {
  console.log("New development environment. Running `npm install`.")
  npm_install()
}

const {engines} = require("../package.json")

const node_version = process.version
const npm_version = cp.execSync("npm --version").toString().trim()

const semver = require("semver")

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
  console.log("package.json has changed. Running `npm install`.")
  npm_install()
}

const {register} = require("ts-node")

process.on('uncaughtException', function(err) {
  console.error(err)
  process.exit(1)
})

register({project: "./make/tsconfig.json", cache: false})

if (require.main != null)
  require("./main")
