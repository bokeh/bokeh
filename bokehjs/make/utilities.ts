import fs from "node:fs"
import {join, posix} from "node:path"

import * as oxc from "oxc-parser"

/**
 * Orders test modules, so that each one comes after all test modules it imports,
 * either directly or through other (e.g. helper) modules. Tests are attributed to
 * the module being loaded, so a test module imported by another one has to be loaded
 * first, otherwise its tests would be attributed to the importing module.
 */
export function order_by_imports(src_dir: string, files: string[], is_test_module: (file: string) => boolean): string[] {
  const known = new Set(files)
  const imports_cache = new Map<string, string[]>()

  function imports_of(file: string): string[] {
    const cached = imports_cache.get(file)
    if (cached != null) {
      return cached
    }

    const source = fs.readFileSync(join(src_dir, file), {encoding: "utf-8"})
    const {module} = oxc.parseSync(file, source)
    const specifiers = [
      ...module.staticImports.map(({moduleRequest}) => moduleRequest.value),
      // re-exports, i.e. `export ... from "..."`
      ...module.staticExports.flatMap(({entries}) => entries.flatMap(({moduleRequest}) => moduleRequest != null ? [moduleRequest.value] : [])),
    ]

    const imports = []
    for (const specifier of specifiers) {
      if (specifier.startsWith(".")) {
        const path = posix.join(posix.dirname(file), specifier).replace(/\.js$/, "")
        const resolved = [path, `${path}.ts`, `${path}.tsx`, `${path}/index.ts`].find((path) => known.has(path))
        if (resolved != null) {
          imports.push(resolved)
        }
      }
    }

    imports_cache.set(file, imports)
    return imports
  }

  const ordered: string[] = []
  const visited = new Set<string>()

  function visit(file: string): void {
    if (!visited.has(file)) {
      visited.add(file)
      for (const imported of imports_of(file)) {
        visit(imported)
      }
      if (is_test_module(file)) {
        ordered.push(file)
      }
    }
  }

  for (const file of files) {
    visit(file)
  }

  return ordered
}
