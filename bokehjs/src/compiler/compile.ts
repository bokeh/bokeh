import {mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync} from "node:fs"
import {tmpdir} from "node:os"
import {dirname, join, resolve} from "node:path"

import {parseSync, Visitor} from "rolldown/utils"
import type {EncodedSourceMap} from "@jridgewell/trace-mapping"
import lesscss from "less"

import type {Config} from "./compiler.js"
import {run_typescript} from "./compiler.js"
import {directory_exists, read, write} from "./sys.js"

import tsconfig_json from "./tsconfig.ext.json" with {type: "json"}

function source_directory(temporary: string, file: string): string {
  const ancestors = []
  for (let directory = dirname(resolve(file)); ; directory = dirname(directory)) {
    ancestors.push(directory)
    if (dirname(directory) == directory) {
      break
    }
  }

  // Preserve native package lookup without writing into the caller's source
  // tree. Directory junctions also work on Windows without symlink privileges.
  let directory = temporary
  for (const ancestor of ancestors.reverse()) {
    directory = join(directory, "p")
    mkdirSync(directory)
    const modules = join(ancestor, "node_modules")
    if (directory_exists(modules)) {
      symlinkSync(modules, join(directory, "node_modules"), "junction")
    }
  }
  return directory
}

function compile_inline(code: string, file: string, lang: "typescript" | "javascript", bokehjs_dir: string,
    esm = false): {code: string, map?: string} | {error: string} {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), "bokeh-typescript-")))
  try {
    const directory = lang == "typescript" && !esm ? source_directory(temporary, file) : temporary
    const basename = esm ? (lang == "typescript" ? "input.ts" : "input.js") : (lang == "typescript" ? "input.cts" : "input.cjs")
    const input = join(directory, basename)
    write(input, code)
    const config: Config = {
      compilerOptions: {
        ...(lang == "typescript" ? tsconfig_json.compilerOptions : {
          target: tsconfig_json.compilerOptions.target,
          allowJs: true,
        }),
        module: "nodenext",
        moduleResolution: "nodenext",
        moduleDetection: "legacy",
        rootDirs: [directory, dirname(resolve(file))],
        outDir: undefined,
        paths: {
          "@bokehjs/*": [join(bokehjs_dir, "js/lib/*")],
          "*": [join(bokehjs_dir, "js/lib/*")],
        },
        types: [],
        declaration: false,
        declarationMap: false,
        sourceMap: esm,
        inlineSources: esm,
        noEmit: true,
      },
      files: [input],
    }

    function diagnostics(output: string): string {
      // The API accepts source strings; temporary paths are an implementation
      // detail and diagnostics should continue to identify the caller's file.
      return output.replaceAll(input, file).replaceAll(input.replaceAll("\\", "/"), file)
        .replaceAll(basename, file)
    }

    if (lang == "typescript" && !esm) {
      const checked = run_typescript(config, directory, bokehjs_dir, ["--pretty", "true"])
      if (checked.status != 0) {
        return {error: diagnostics(checked.output)}
      }
    }

    // Native TS7 currently exposes no program.emit/transpileModule JS API.
    // Its CLI performs both checking above and syntax-preserving emission here.
    // The graph bundler checks TypeScript roots and helpers together after
    // resolution. The public single-source API retains its CommonJS output.
    const emitted = run_typescript({
      ...config,
      compilerOptions: {
        ...config.compilerOptions,
        module: esm ? "esnext" : "commonjs",
        moduleResolution: esm ? "bundler" : undefined,
        noEmit: false,
        noCheck: true,
        noResolve: true,
        rootDir: directory,
        outDir: join(temporary, "out"),
      },
    }, directory, bokehjs_dir, ["--pretty", "true"])
    if (emitted.status != 0) {
      return {error: diagnostics(emitted.output)}
    }
    const output = read(join(temporary, esm ? "out/input.js" : "out/input.cjs"))
    if (output == null) {
      throw new Error("TypeScript 7 did not emit the requested inline source")
    }
    if (esm) {
      const map = JSON.parse(read(join(temporary, "out/input.js.map"))!) as EncodedSourceMap
      map.sources = [file.replaceAll("\\", "/")]
      map.sourcesContent = [code]
      delete map.sourceRoot
      return {code: output.replace(/^\/\/# sourceMappingURL=.*$/gm, ""), map: JSON.stringify(map)}
    }
    return {code: output}
  } finally {
    rmSync(temporary, {recursive: true, force: true})
  }
}

export function compile_esm(code: string, file: string, lang: "typescript" | "javascript", bokehjs_dir: string): {code: string, map?: string} {
  const result = compile_inline(code, file, lang, bokehjs_dir, true)
  if ("error" in result) {
    throw new Error(result.error)
  }
  return result
}

export async function compile_and_resolve_deps(input: {code: string, lang: string, file?: string | null, bokehjs_dir: string}) {
  const {code, lang} = input
  const bokehjs_dir = resolve(input.bokehjs_dir)
  const file = input.file ?? (lang == "javascript" ? "input.js" : "input.ts")

  if (lang == "less") {
    try {
      const {css} = await lesscss.render(code, {filename: file, compress: true})
      return {code: css}
    } catch (error) {
      return {error: `${error}`}
    }
  }
  if (lang != "typescript" && lang != "javascript") {
    throw new Error(`unsupported input type: ${lang}`)
  }

  const compiled = compile_inline(code, file, lang, bokehjs_dir)
  if ("error" in compiled) {
    return compiled
  }
  const deps = new Set<string>()
  const {program} = parseSync(file, compiled.code)
  new Visitor({
    CallExpression(node) {
      if (node.callee.type == "Identifier" && node.callee.name == "require" && node.arguments.length == 1) {
        const [arg] = node.arguments
        if (arg.type == "Literal" && typeof arg.value == "string") {
          deps.add(arg.value)
        }
      }
    },
  }).visit(program)
  return {code: compiled.code, deps: [...deps]}
}
