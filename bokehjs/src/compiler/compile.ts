import {join} from "node:path"

import lesscss from "less"

import type {TSOutput, Inputs, Outputs, CompilerOptions} from "./compiler.js"
import {compiler_host, parse_tsconfig, compile_files, report_diagnostics, default_lib_dir} from "./compiler.js"
import type {Path} from "./sys.js"
import {rename} from "./sys.js"
import {to_cjs} from "./esm_to_cjs.js"
import * as transforms from "./transforms.js"

import tsconfig_json from "./tsconfig.ext.json" with {type: "json"}

export function compile_typescript(base_dir: string, inputs: Inputs, bokehjs_dir: string): {outputs?: Outputs} & TSOutput {
  const preconfigure: CompilerOptions = {
    paths: {
      "@bokehjs/*": [join(bokehjs_dir, "js/lib/*")],
      "*": [join(bokehjs_dir, "js/lib/*")],
    },
    outDir: undefined,
    sourceMap: false,
    declaration: false,
    declarationMap: false,
  }

  // XXX: silence the config validator. We are providing inputs through `inputs` argument anyway.
  const json = {...tsconfig_json, include: undefined, files: ["dummy.ts"]}
  const tsconfig = parse_tsconfig(json, base_dir, preconfigure)
  if (tsconfig.diagnostics != null) {
    return {diagnostics: tsconfig.diagnostics}
  }

  const host = compiler_host(inputs, tsconfig.options, default_lib_dir(bokehjs_dir))

  const outputs: Outputs = new Map()
  host.writeFile = (name: Path, data: string) => {
    outputs.set(name, data)
  }

  const files = [...inputs.keys()]
  return {outputs, ...compile_files(files, tsconfig.options, host)}
}

/** Converts ES modules to CommonJS (like the linker does) and leaves other code as is. */
function compile_javascript(file: string, code: string): {code: string, deps: string[]} | {error: string} {
  const {program, module, errors} = transforms.parse(file, code, {sourceType: "unambiguous"})
  if (errors.length != 0) {
    return {error: errors.map((error) => error.codeframe ?? `${file}: ${error.message}`).join("\n")}
  }
  if (module.hasModuleSyntax) {
    try {
      const {code: output, deps} = to_cjs(file, code)
      return {code: output, deps}
    } catch (error) {
      return {error: error instanceof Error ? error.message : `${error}`}
    }
  } else {
    return {code, deps: transforms.collect_deps(program)}
  }
}

function normalize(path: string): string {
  return path.replace(/\\/g, "/")
}

export async function compile_and_resolve_deps(input: {code: string, lang: string, file: string, bokehjs_dir: string}) {
  const {code, file, lang, bokehjs_dir} = input

  switch (lang) {
    case "typescript": {
      const inputs = new Map([[normalize(file), code]])
      const {outputs, diagnostics} = compile_typescript(".", inputs, bokehjs_dir)

      if (diagnostics != null && diagnostics.length != 0) {
        const failure = report_diagnostics(diagnostics)
        return {error: failure.text}
      } else {
        const js_file = normalize(rename(file, {ext: ".js"}))
        return compile_javascript(js_file, outputs!.get(js_file)!)
      }
    }
    case "javascript":
      return compile_javascript(file, code)
    case "less":
      try {
        const {css} = await lesscss.render(code, {filename: file, compress: true})
        return {code: css}
      } catch (error) {
        return {error: `${error}`}
      }
    default:
      throw new Error(`unsupported input type: ${lang}`)
  }
}
