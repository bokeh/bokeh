const crypto = require("crypto")
const cp = require("child_process")
const fs = require("fs")
const {join, dirname, basename} = require("path")

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

const semver = require("semver")
const {argv} = require("yargs")

const {engines, workspaces} = require("../package.json")

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
  const hash_file = join(dirname(file), `.${basename(file)}`)

  if (!fs.existsSync(hash_file))
    return false

  const old_hash = fs.readFileSync(hash_file)

  const new_hash = crypto.createHash("sha256")
                         .update(fs.readFileSync(file))
                         .digest("hex")

  return old_hash == new_hash
}

if (argv["up-to-date"] !== false) {
  for (const workspace of ["", ...workspaces]) {
    const path = join(workspace, "package.json")
    if (!is_up_to_date(path)) {
      console.log(`${path} has changed. Running 'npm install'.`)
      npm_install()
      break
    }
  }
}

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
