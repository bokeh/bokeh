import assert from "node:assert/strict"
import {join, normalize, resolve} from "node:path"

import {buildSync} from "esbuild"

const build_dir = normalize(`${import.meta.dirname}/../..`)
const contracts = new Set(["plot_mapping.js", "coordinate_transform.js"])

for (const contract of contracts) {
  const result = buildSync({
    entryPoints: [join(build_dir, "js/lib/models/coordinates", contract)],
    bundle: true,
    write: false,
    metafile: true,
    platform: "browser",
    format: "esm",
    treeShaking: false,
  })
  for (const input of Object.keys(result.metafile.inputs)) {
    const path = resolve(input).replaceAll("\\", "/")
    if (path.includes("/models/coordinates/")) {
      assert.ok(contracts.has(path.split("/").at(-1)!), `${contract} imports concrete coordinate code: ${path}`)
    }
  }
}

console.log("Shared coordinate contracts have no concrete mapping dependencies")
