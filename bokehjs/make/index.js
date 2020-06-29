const crypto = require("crypto")
const cp = require("child_process")
const fs = require("fs")

function npm_install() {
  const npm = process.platform != "win32" ? "npm" : "npm.cmd"
  const {status} = cp.spawnSync(npm, ["install"], {stdio: "inherit"})
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

const package_lock = fs.readFileSync("package-lock.json", {encoding: "utf-8"})
const package_lock_updated = package_lock.replace(/\bhttp:\/\//g, "https://")
fs.writeFileSync("package-lock.json", package_lock_updated, {encoding: "utf-8"})

const {register} = require("ts-node")

process.on('uncaughtException', function(err) {
  console.error(err)
  process.exit(1)
})

register({project: "./make/tsconfig.json", cache: false, logError: true})

const tsconfig_paths = require("tsconfig-paths")

tsconfig_paths.register({
  baseUrl: __dirname,
  paths: {
    "@compiler/*": ["../src/compiler/*"],
  },
})

if (require.main != null)
  require("./main")
