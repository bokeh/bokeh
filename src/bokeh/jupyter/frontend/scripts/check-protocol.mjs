import {readFile} from "node:fs/promises"
import {resolve} from "node:path"
import ts from "typescript"

const root = resolve(import.meta.dirname, "..")
const manifest = JSON.parse(await readFile(resolve(root, "../protocol.json"), "utf8"))
const source = await readFile(resolve(root, "src/protocol.ts"), "utf8")
const javascript = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022},
}).outputText
const protocol = await import(`data:text/javascript;base64,${Buffer.from(javascript).toString("base64")}`)

const expected = {
  PROTOCOL_VERSION: manifest.version,
  ARTIFACT_MIME_TYPE: manifest.mime_types.artifact,
  DISPLAY_MIME_TYPE: manifest.mime_types.display,
  FILE_MIME_TYPE: manifest.mime_types.file,
  RESOURCES_MIME_TYPE: manifest.mime_types.resources,
  NOTEBOOK_COMM_TARGET: manifest.comm_targets.notebook,
  RESOURCE_COMM_TARGET: manifest.comm_targets.resources,
  MAX_PENDING_PATCHES: manifest.limits.pending_patches,
  MAX_PENDING_BYTES: manifest.limits.pending_bytes,
}
for (const [name, value] of Object.entries(expected)) {
  if (protocol[name] !== value) {
    throw new Error(`${name} differs between protocol.json (${value}) and TypeScript (${protocol[name]})`)
  }
}

const extension = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"))
const bokehjs = JSON.parse(await readFile(resolve(root, "../../../../bokehjs/package.json"), "utf8"))
if (extension.version !== bokehjs.version) {
  throw new Error(`Jupyter extension ${extension.version} does not match BokehJS ${bokehjs.version}`)
}
