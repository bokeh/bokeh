import cp from "node:child_process"
import yargs from "yargs"

const argv = yargs(process.argv.slice(2)).help(false).options({}).parseSync()

process.on("uncaughtException", function(err) {
  console.error(err)
  process.exit(1)
})

function compile() {
  const is_windows = process.platform == "win32"
  const npx = is_windows ? "npx.cmd" : "npx"
  cp.spawnSync(npx, ["tsc", "--project", "./test/devtools/tsconfig.json"], {stdio: "inherit", shell: is_windows})
}

compile()

void import(argv._[0] == "server" ? "./_build/server.js" : "./_build/devtools.js")
