import cp from "node:child_process"

process.on("uncaughtException", function(err) {
  console.error(err)
  process.exit(1)
})

function compile() {
  const is_windows = process.platform == "win32"
  const npx = is_windows ? "npx.cmd" : "npx"
  const {status} = cp.spawnSync(npx, ["tsc", "--project", "./src/server/tsconfig.json"], {stdio: "inherit", shell: is_windows})
  if (status !== 0) {
    process.exit(status)
  }
}

compile()

void import("../../build/server/server/server.js")
