import {readFile} from "node:fs/promises"
import {resolve} from "node:path"

const root = resolve(import.meta.dirname, "..")
const python = await readFile(resolve(root, "../../io/jupyter.py"), "utf8")
const pythonNotebook = await readFile(resolve(root, "../../io/notebook.py"), "utf8")
const pythonArtifact = await readFile(resolve(root, "../../embed/artifact.py"), "utf8")
const typescript = await readFile(resolve(root, "src/protocol.ts"), "utf8")
const kernel = await readFile(resolve(root, "src/kernel.ts"), "utf8")
const extension = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"))
const bokehjs = JSON.parse(await readFile(resolve(root, "../../../../bokehjs/package.json"), "utf8"))

function value(source, name) {
  const match = source.match(new RegExp(`(?:export const )?${name}\\s*=\\s*(?:\"([^\"]+)\"|'([^']+)'|(\\d+))`))
  if (match == null) throw new Error(`Could not find ${name}`)
  return match[1] ?? match[2] ?? match[3]
}

for (const name of ["PROTOCOL_VERSION", "RESOURCES_MIME_TYPE", "DISPLAY_MIME_TYPE", "FILE_MIME_TYPE"]) {
  const left = value(python, name)
  const right = value(typescript, name)
  if (left !== right) throw new Error(`${name} differs between Python (${left}) and TypeScript (${right})`)
}
const artifactMime = value(pythonArtifact, "EMBED_ARTIFACT_MIME_TYPE")
if (artifactMime !== value(typescript, "ARTIFACT_MIME_TYPE")) {
  throw new Error(`ARTIFACT_MIME_TYPE differs between Python (${artifactMime}) and TypeScript (${value(typescript, "ARTIFACT_MIME_TYPE")})`)
}

for (const [pythonName, typescriptName] of [
  ["_NOTEBOOK_COMM_TARGET", "NOTEBOOK_COMM_TARGET"],
  ["_RESOURCE_COMM_TARGET", "RESOURCE_COMM_TARGET"],
]) {
  const left = value(pythonNotebook, pythonName)
  const right = value(kernel, typescriptName)
  if (left !== right) throw new Error(`${pythonName} differs between Python (${left}) and TypeScript (${right})`)
}

if (extension.version !== bokehjs.version) {
  throw new Error(`Jupyter extension ${extension.version} does not match BokehJS ${bokehjs.version}`)
}
