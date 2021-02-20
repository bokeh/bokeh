import * as path from "path"
import * as ts from "typescript"
import lesscss from "less"

import {compiler_host, parse_tsconfig, default_transformers, compile_files, report_diagnostics, TSOutput, Inputs, Outputs} from "./compiler"
import {rename, Path} from "./sys"
import * as transforms from "./transforms"

import * as tsconfig_json from "./tsconfig.ext.json"

function parse_patched_tsconfig(base_dir: string, preconfigure: ts.CompilerOptions) {
  // XXX: silence the config validator. We are providing inputs through `inputs` argument anyway.
  const json = {...tsconfig_json, include: undefined, files: ["dummy.ts"]}
  return parse_tsconfig(json, base_dir, preconfigure)
}

export function compile_typescript(base_dir: string, inputs: Inputs, bokehjs_dir: string): {outputs?: Outputs} & TSOutput {
  const preconfigure: ts.CompilerOptions = {
    module: ts.ModuleKind.CommonJS,
    paths: {
      "*": [
        path.join(bokehjs_dir, "js/lib/*"),
        path.join(bokehjs_dir, "js/types/*"),
      ],
    },
    outDir: undefined,
  }

  const tsconfig = parse_patched_tsconfig(base_dir, preconfigure)
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

function compile_javascript(base_dir: string, file: string, code: string): { output?: string } & TSOutput {
  const tsconfig = parse_patched_tsconfig(base_dir, {})
  if (tsconfig.diagnostics != null)
    return {diagnostics: tsconfig.diagnostics}

  const {outputText, diagnostics} = ts.transpileModule(code, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: tsconfig.options.target,
      module: ts.ModuleKind.CommonJS,
    },
  })
  return {output: outputText, diagnostics}
}

function normalize(path: string): string {
  return path.replace(/\\/g, "/")
}

export async function compile_and_resolve_deps(input: {code: string, lang: string, file: string, bokehjs_dir: string}) {
  const {file, lang, bokehjs_dir} = input
  const {code} = input

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
    case "javascript": {
      const result = compile_javascript(".", file, code)
      if (result.diagnostics != null && result.diagnostics.length != 0) {
        const failure = report_diagnostics(result.diagnostics)
        return {error: failure.text}
      } else {
        output = result.output!
      }
      break
    }
    case "less":
      try {
        const {css} = await lesscss.render(code, {filename: file, compress: true})
        return {code: css}
      } catch (error: unknown) {
        return {error: `${error}`}
      }
    default:
      throw new Error(`unsupported input type: ${lang}`)
  }

  const source = ts.createSourceFile(file, output, ts.ScriptTarget.ES2015, true, ts.ScriptKind.JS)
  const deps = transforms.collect_deps(source)

  return {code: output, deps}
}
