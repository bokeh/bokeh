import fs from "node:fs/promises"
import {dirname, join, resolve} from "node:path"
import type {Metafile} from "esbuild"

// Use the bundler's actual inputs, including nested versions, rather than a
// hand-maintained list that misses new runtime dependencies after an upgrade.
export async function compiler_notices(metafiles: Metafile[]): Promise<string> {
  const packages = new Set<string>()
  for (const {inputs} of metafiles) {
    for (const file of Object.keys(inputs)) {
      if (file.includes("node_modules/")) {
        let directory = dirname(resolve(file))
        while (true) {
          try {
            await fs.access(join(directory, "package.json"))
            packages.add(directory)
            break
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code != "ENOENT" || dirname(directory) == directory) {
              throw error
            }
            directory = dirname(directory)
          }
        }
      }
    }
  }
  const notices = new Map<string, string>()
  for (const directory of packages) {
    const {name, version, license} = JSON.parse(await fs.readFile(join(directory, "package.json"), "utf8")) as {
      name: string
      version: string
      license: string
    }
    const files = (await fs.readdir(directory)).filter((name) => /^(licen[cs]e|copying|notice|third[-_]party[-_]licen[cs]e)([._-]|$)/i.test(name)).sort()
    if (files.length == 0) {
      throw new Error(`Missing bundled dependency license: ${name}@${version}`)
    }
    const texts = await Promise.all(files.map(async (file) => `${file}\n\n${await fs.readFile(join(directory, file), "utf8")}`))
    notices.set(`${name}@${version}`, `${name}@${version} (${license})\n\n${texts.join("\n\n")}`)
  }
  const sorted = [...notices].sort(([a], [b]) => a.localeCompare(b)).map(([, text]) => text)
  return `${sorted.join("\n\n========================================\n\n")}\n`
}
