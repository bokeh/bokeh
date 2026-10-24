import cp from "node:child_process"

process.on("uncaughtException", function(err) {
  console.error(err)
  process.exit(1)
})

function compile() {
  const compiler = "./node_modules/typescript/bin/tsc"
  const {status} = cp.spawnSync(process.execPath, [compiler, "--project", "./src/server/tsconfig.json"], {stdio: "inherit"})
  if (status !== 0) {
    process.exit(status ?? 1)
  }
}

compile()

void import("../../build/server/server/server.js")
