const crypto = require("crypto")
const semver = require("semver")
const cp = require("child_process")
const fs = require("fs")

const {engines} = require("../package.json")

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
  console.log("package.json has changed. Running `npm install`.")
  const {status} = cp.spawnSync("npm", ["install"], {stdio: "inherit"})
  if (status !== 0)
    process.exit(status)
}

const {register, TSError} = require("ts-node")
const chalk = require("chalk")

function prettyTSError(error) {
  const title = `${chalk.red('⨯')} Unable to compile TypeScript:`
  return `${chalk.bold(title)}\n${error.diagnostics.map((line) => line.message).join('\n')}`
}

process.on('uncaughtException', function(err) {
  console.error((err instanceof TSError) ? prettyTSError(err) : err)
  process.exit(1)
})

register({project: "./make/tsconfig.json", cache: false})

if (require.main != null)
  require("./main")
