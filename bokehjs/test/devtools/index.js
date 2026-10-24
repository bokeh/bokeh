import cp from "node:child_process"
import yargs from "yargs"

const argv = yargs(process.argv.slice(2)).help(false).options({}).parseSync()

process.on("uncaughtException", function(err) {
  console.error(err)
  process.exit(1)
})

function compile() {
  const {status, error} = cp.spawnSync(process.execPath,
    ["./node_modules/typescript/bin/tsc", "--project", "./test/devtools/tsconfig.json"], {stdio: "inherit"})
  if (error != null) {
    throw error
  }
  if (status != 0) {
    process.exit(status ?? 1)
  }
}

compile()

void import(argv._[0] == "server" ? "./_build/server.js" : "./_build/devtools.js")
