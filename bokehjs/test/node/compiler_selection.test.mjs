import fs from "node:fs"
import {tmpdir} from "node:os"
import {dirname, join} from "node:path"
import {fileURLToPath, pathToFileURL} from "node:url"

import assert from "node:assert/strict"
import {afterEach, beforeEach, describe, it} from "node:test"

const built = fileURLToPath(new URL("../../build/js/compiler/", import.meta.url))
let temporary, typescript_command

beforeEach(async () => {
  temporary = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "bokeh compiler selection ")))
  // Move the real module to a cache-shaped directory to test import.meta.url
  // resolution independently of this checkout's installed TypeScript.
  fs.mkdirSync(join(temporary, "runtime"))
  for (const name of ["compiler.js", "sys.js"]) {
    fs.copyFileSync(join(built, name), join(temporary, "runtime", name))
  }
  fs.writeFileSync(join(temporary, "runtime/package.json"), '{"type":"module"}')
  ;({typescript_command} = await import(pathToFileURL(join(temporary, "runtime/compiler.js"))))
})

afterEach(() => {
  fs.rmSync(temporary, {recursive: true, force: true})
})

function touch(path) {
  fs.mkdirSync(dirname(path), {recursive: true})
  fs.writeFileSync(path, "")
}

describe("native TypeScript compiler selection", () => {
  it("uses the adapter's cache regardless of resource location or workspace installations", () => {
    const resources = join(temporary, "relocated assets")
    const compiler = join(temporary, "runtime/node_modules/typescript/bin/tsc")
    touch(compiler)
    touch(join(temporary, "node_modules/typescript/bin/tsc"))
    assert.deepEqual(typescript_command(resources), [process.execPath, compiler])
  })

  it("uses the explicit source-workspace compiler when no cached runtime is adjacent", () => {
    const resources = join(temporary, "build")
    const compiler = join(temporary, "node_modules/typescript/bin/tsc")
    touch(compiler)
    assert.deepEqual(typescript_command(resources), [process.execPath, compiler])
  })

  it("reports missing native assets without selecting an old portable fallback", () => {
    touch(join(temporary, "js/compiler/typescript.mjs"))
    assert.throws(() => typescript_command(temporary), /Cannot locate the TypeScript compiler/)
  })
})
