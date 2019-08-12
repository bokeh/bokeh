import * as path from "path"
import * as ts from "typescript"
const coffee = require("coffeescript")
import * as lesscss from "less"

import {compiler_host, parse_tsconfig, default_transformers, compile_files, report_diagnostics, TSOutput, Inputs, Outputs, Path} from "./compiler"
import * as transforms from "./transforms"

import * as tsconfig_json from "./tsconfig.ext.json"

export function compile_typescript(base_dir: string, inputs: Inputs, bokehjs_dir: string): {outputs?: Outputs} & TSOutput {
  const preconfigure: ts.CompilerOptions = {
    paths: {
      "*": [
        path.join(bokehjs_dir, "js/lib/*"),
        path.join(bokehjs_dir, "js/types/*"),
      ],
    },
    outDir: undefined,
  }

  const tsconfig = parse_tsconfig(tsconfig_json, base_dir, preconfigure)
  if (tsconfig.diagnostics != null)
    return {diagnostics: tsconfig.diagnostics}

  const host = compiler_host(inputs, tsconfig.options, bokehjs_dir)
  const transformers = default_transformers(tsconfig.options)

  const outputs: Outputs = new Map()
  host.writeFile = (name: Path, data: string) => {
    outputs.set(name, data)
  }

  const files = [...inputs.keys()]
  return {outputs, ...compile_files(files, tsconfig.options, transformers, host)}
}

function compile_javascript(file: string, code: string): {output: string, error?: string} {
  const result = ts.transpileModule(code, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.CommonJS,
    },
  })

  const format_host: ts.FormatDiagnosticsHost = {
    getCanonicalFileName: (path) => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  }

  const {outputText, diagnostics} = result
  if (diagnostics == null || diagnostics.length == 0)
    return {output: outputText}
  else {
    const error = ts.formatDiagnosticsWithColorAndContext(
      ts.sortAndDeduplicateDiagnostics(diagnostics), format_host)
    return {output: outputText, error}
  }
}

function rename(p: string, options: {dir?: string, ext?: string}): string {
  let {dir, name, ext} = path.parse(p)
  if (options.dir != null)
    dir = options.dir
  if (options.ext != null)
    ext = options.ext
  return path.format({dir, name, ext})
}

function normalize(path: string): string {
  return path.replace(/\\/g, "/")
}

export async function compile_and_resolve_deps(input: {code: string, lang: string, file: string, bokehjs_dir: string}) {
  const {file, lang, bokehjs_dir} = input
  let {code} = input

  let output: string
  switch (lang) {
    case "typescript":
      const inputs = new Map([[normalize(file), code]])
      const {outputs, diagnostics} = compile_typescript(".", inputs, bokehjs_dir)

      if (diagnostics != null && diagnostics.length != 0) {
        const failure = report_diagnostics(diagnostics)
        return {error: failure.text}
      } else {
        const js_file = normalize(rename(file, {ext: ".js"}))
        output = outputs!.get(js_file)!
      }
      break
    case "coffeescript":
      try {
        code = coffee.compile(code, {bare: true, shiftLine: true})
      } catch (error) {
        return {error: error.toString()}
      }
    case "javascript": {
      const result = compile_javascript(file, code)
      if (result.error == null)
        output = result.output
      else
        return {error: result.error}
      break
    }
    case "less":
      try {
        const {css} = await lesscss.render(code, {filename: file, compress: true})
        return {code: css}
      } catch (error) {
        return {error: error.toString()}
      }
    default:
      throw new Error(`unsupported input type: ${lang}`)
  }

  const source = ts.createSourceFile(file, output, ts.ScriptTarget.ES5, true, ts.ScriptKind.JS)
  const deps = transforms.collect_deps(source)

  return {code: output, deps}
}
