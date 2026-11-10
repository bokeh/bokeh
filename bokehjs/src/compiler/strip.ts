// Compilation of TypeScript without TypeScript, i.e. without type checking. Types are
// stripped with oxc and only syntax and relative imports are checked.
import {basename, dirname, extname, join, relative, resolve} from "node:path"

import {transformSync} from "oxc-transform"

import type {Path} from "./sys.js"
import {read, write, file_exists, rename} from "./sys.js"
import type {SourceMap} from "./source_map.js"
import {parse} from "./transforms.js"

export type Stripped = {code: string, map: SourceMap}

/** Strips types from `code` of `file` (an ES module), or returns errors. */
export function strip_types(file: Path, code: string): Stripped | {errors: string[]} {
  const {code: output, map, errors, helpersUsed} = transformSync(file, code, {
    lang: /\.[cm]?js$/.test(file) ? "js" : "ts",
    sourceType: "module",
    decorator: {legacy: true},
    sourcemap: true,
  })
  if (errors.length != 0) {
    return {errors: errors.map((error) => error.codeframe ?? `${file}: ${error.message}`)}
  }
  // e.g. decorators, which would require oxc's runtime
  const helpers = Object.keys(helpersUsed)
  if (helpers.length != 0) {
    return {errors: [`${file}: unsupported syntax without TypeScript (requires ${helpers.join(", ")} helpers)`]}
  }
  return {code: output, map: {...map!, version: 3}}
}

const is_relative = (spec: string) => spec.startsWith("./") || spec.startsWith("../")

/** Returns specifiers of static and (literal) dynamic imports and re-exports. */
function imports_of(file: Path, code: string): string[] {
  const {module} = parse(file, code, {sourceType: "module"})
  const specs = [
    ...module.staticImports.map((stmt) => stmt.moduleRequest.value),
    ...module.staticExports.flatMap((stmt) => stmt.entries.map((entry) => entry.moduleRequest?.value)),
    ...module.dynamicImports.map(({moduleRequest: {start, end}}) => {
      const literal = /^(["'])(.*)\1$/.exec(code.slice(start, end))
      return literal?.[2]
    }),
  ]
  return [...new Set(specs.filter((spec) => spec != null))]
}

/** Resolves a relative import like TypeScript's `bundler` resolution, e.g. `./a.js` to `./a.ts`. */
function resolve_relative(dir: Path, spec: string): Path | null {
  const path = resolve(dir, spec)
  const candidates = /\.[cm]?js$/.test(path)
    ? [path.replace(/\.([cm]?)js$/, ".$1ts"), path]
    : [`${path}.ts`, `${path}.js`, join(path, "index.ts"), join(path, "index.js"), path]
  return candidates.find((candidate) => !candidate.endsWith(".d.ts") && file_exists(candidate)) ?? null
}

/** Returns `line:column` of the first occurrence of `spec` as a string literal in `code`. */
function location(code: string, spec: string): string {
  const index = Math.max(code.indexOf(JSON.stringify(spec)), code.indexOf(`'${spec}'`))
  const lines = code.slice(0, Math.max(index, 0)).split("\n")
  return `${lines.length}:${lines[lines.length - 1].length + 1}`
}

/**
 * Strips types of modules reachable from `entry` through relative imports and writes
 * them with source maps to `lib_dir`. Imports of CSS modules refer to modules generated
 * in `lib_dir` (see `wrap_css_modules()`). Returns errors, if any.
 */
export function strip_modules(entry: Path, base_dir: Path, lib_dir: Path): {files: Path[], errors: string[]} {
  const errors: string[] = []
  const files = [entry]

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const output = join(lib_dir, relative(base_dir, file))
    const code = read(file)
    if (code == null) {
      errors.push(`${relative(process.cwd(), file)}: can't read this file`)
      continue
    }

    if (!/\.[cm]?[jt]s$/.test(file)) { // e.g. JSON
      write(output, code)
      continue
    }

    const name = relative(process.cwd(), file) // in errors
    const result = strip_types(name, code)
    if ("errors" in result) {
      errors.push(...result.errors)
      continue
    }

    const js_output = rename(output, {ext: extname(output).replace("t", "j")})
    const sources = [relative(dirname(js_output), file).replaceAll("\\", "/")]
    write(js_output, `${result.code}\n//# sourceMappingURL=${basename(js_output)}.map\n`)
    write(`${js_output}.map`, JSON.stringify({...result.map, file: basename(js_output), sources}))

    for (const spec of imports_of(file, result.code).filter(is_relative)) {
      const resolved = resolve_relative(dirname(file), spec)
      if (resolved != null) {
        if (!files.includes(resolved)) {
          files.push(resolved)
        }
      } else if (!(spec.endsWith(".css") && file_exists(resolve(dirname(js_output), `${spec}.js`)))) {
        errors.push(`${name}:${location(code, spec)} - error: can't resolve '${spec}'`)
      }
    }
  }

  return {files, errors}
}
