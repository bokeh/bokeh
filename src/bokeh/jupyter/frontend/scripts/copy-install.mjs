import {copyFile, mkdir, readFile, writeFile} from "node:fs/promises"
import {dirname, resolve} from "node:path"
import {fileURLToPath} from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const files = [
  ["install.json", "../labextension/install.json"],
]

for (const [source, target] of files) {
  const destination = resolve(root, target)
  await mkdir(dirname(destination), {recursive: true})
  await copyFile(resolve(root, source), destination)
}

const style = resolve(root, "../labextension/static/style.js")
await writeFile(style, `${(await readFile(style, "utf8")).trimEnd()}\n`)
