import fs from "node:fs"
import {spawnSync} from "node:child_process"
import {tmpdir} from "node:os"
import {join} from "node:path"
import {fileURLToPath} from "node:url"

import assert from "node:assert/strict"
import {describe, it} from "node:test"

const root = fileURLToPath(new URL("../..", import.meta.url))

describe("native compiler import annotations", () => {
  it("preserves annotations on dynamic imports through the native compiler", {timeout: 30_000}, () => {
    const temporary = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), "bokeh-annotated-import-")))
    try {
      const code = `
import {Model} from "@bokehjs/model"
export class AnnotatedModel extends Model {
  static async load(url: string) {
    return await import(/* @vite-ignore */ /* webpackIgnore: true */ url)
  }
}
`
      const request = {
        entry: "custom/main/annotated",
        models: [{name: "AnnotatedModel", full_name: "AnnotatedModel", module: "custom/annotated", code,
                  lang: "typescript", file: join(temporary, "annotated.ts"), path: temporary}],
        bokehjs_dir: join(root, "build"),
        bokeh_version: "4.0.0",
      }
      const result = spawnSync(process.execPath, [join(root, "build/js/compiler/main.js"), "bundle"], {
        cwd: temporary,
        input: JSON.stringify(request),
        encoding: "utf8",
        timeout: 30_000,
      })
      assert.equal(result.error, undefined)
      assert.equal(result.status, 0, result.stderr)
      const reply = JSON.parse(result.stdout)
      assert.equal(reply.error, undefined)
      assert.ok((reply.code).includes("webpackIgnore: true"))
      assert.ok((reply.code).includes("@vite-ignore"))
    } finally {
      fs.rmSync(temporary, {recursive: true, force: true})
    }
  })
})
