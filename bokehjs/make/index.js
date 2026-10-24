import {isAbsolute} from "node:path"
import {mkdir} from "node:fs/promises"
import {mkdtempSync, rmSync} from "node:fs"
import {pathToFileURL} from "node:url"
import pkg_json from "../package.json" with {type: "json"}

// Locked setup cleans before installing npm dependencies in a fresh checkout.
// Leave options and combined commands to the regular task runner below.
if (process.argv.length == 3 && process.argv[2] == "clean:all") {
  rmSync("build", {recursive: true, force: true})
  process.exit(0)
}

// Use the same standard TypeScript loader as the library build. Dependencies
// come from locked setup; running a command never modifies the npm installation.
const {rolldown} = await import("rolldown")
const build = await rolldown({
  input: "make/main.ts",
  platform: "node",
  tsconfig: "make/tsconfig.json",
  external: (id) => !isAbsolute(id) && !id.startsWith(".") && !id.startsWith("#compiler/"),
})
// Concurrent make commands must never overwrite a module another is importing.
// Keep it under make/ so Node still resolves the workspace's dependencies.
await mkdir("make/_build", {recursive: true})
const directory = mkdtempSync("make/_build/run-")
// main() exits explicitly, so its successful path bypasses promise finalizers.
const cleanup = () => rmSync(directory, {recursive: true, force: true})
process.once("exit", cleanup)
const on_signal = (signal) => {
  cleanup()
  // Tasks may forward the signal to children or finish asynchronously. Leave
  // their handlers in control, but preserve default termination during bootstrap.
  if (process.listenerCount(signal) == 1) {
    process.off(signal, on_signal)
    process.kill(process.pid, signal)
  }
}
const signals = ["SIGINT", "SIGTERM"]
for (const signal of signals) {
  // Inspect the listener count before downstream once() handlers are removed.
  process.prependListener(signal, on_signal)
}
try {
  const file = `${directory}/main.mjs`
  try {
    await build.write({file, format: "esm", sourcemap: true})
  } finally {
    await build.close()
  }
  const {main} = await import(pathToFileURL(file).href)
  await main(pkg_json)
} finally {
  cleanup()
  process.removeListener("exit", cleanup)
  for (const signal of signals) {
    process.off(signal, on_signal)
  }
}
