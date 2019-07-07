import chalk from "chalk"
import * as ts from "typescript"

import {dirname, join, relative} from "path"

import * as transforms from "./transforms"
import {read} from "./sys"

export type Path = string

export type CompileConfig = {
  log: (message: string) => void
  out_dir?: OutDir
  css_dir?: Path
}

export type Outputs = Map<string, string>

export interface Failure {
  count: number
  text: string
}

export interface TSOutput {
  outputs?: Outputs
  failure?: Failure
}

function normalize(path: string): string {
  return path.replace(/\\/g, "/")
}

const diagnostics_host: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

export function reportDiagnostics(diagnostics: ReadonlyArray<ts.Diagnostic>): Failure {
  const errors = ts.sortAndDeduplicateDiagnostics(diagnostics)
  const text = ts.formatDiagnosticsWithColorAndContext(errors, diagnostics_host)
  return {count: errors.length, text}
}

export function compileFiles(inputs: string[], options: ts.CompilerOptions, config: CompileConfig): TSOutput {
  const host = ts.createCompilerHost(options)
  const program = ts.createProgram(inputs, options, host)

  const outputs: Outputs = new Map()
  const write = (name: string, output: string) => {
    outputs.set(name, output)
  }

  const transformers: Required<ts.CustomTransformers> = {
    before: [],
    after: [],
    afterDeclarations: [],
  }

  const import_txt = transforms.import_txt((txt_path) => read(txt_path))
  transformers.before.push(import_txt)

  const import_css = transforms.import_css((css_path) => {
    const {css_dir} = config
    const resolved_path = css_path.startsWith(".") || css_dir == null ? css_path : join(css_dir, css_path)
    return read(resolved_path)
  })
  transformers.before.push(import_css)

  const insert_class_name = transforms.insert_class_name()
  transformers.before.push(insert_class_name)

  const remove_use_strict = transforms.remove_use_strict()
  transformers.after.push(remove_use_strict)

  const remove_esmodule = transforms.remove_esmodule()
  transformers.after.push(remove_esmodule)

  const base = options.baseUrl
  if (base != null) {
    const relativize_modules = transforms.relativize_modules((file, module_path) => {
      if (!module_path.startsWith(".") && !module_path.startsWith("/")) {
        const module_file = join(base, module_path)
        if (ts.sys.fileExists(module_file) ||
            ts.sys.fileExists(module_file + ".ts") ||
            ts.sys.fileExists(join(module_file, "index.ts"))) {
          const rel_path = normalize(relative(dirname(file), module_file))
          return rel_path.startsWith(".") ? rel_path : `./${rel_path}`
        }
      }
      return null
    })

    transformers.after.push(relativize_modules)
    transformers.afterDeclarations.push(relativize_modules)
  }

  const emitted = program.emit(undefined, write, undefined, false, transformers)
  const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitted.diagnostics)

  if (diagnostics.length == 0)
    return {outputs}
  else {
    const failure = reportDiagnostics(diagnostics)
    return {outputs, failure}
  }
}

export type OutDir = string | {js: string, dts: string}

export function compileProject(tsconfig_path: string, config: CompileConfig): TSOutput {
  const tsconfig_file = ts.readConfigFile(tsconfig_path, ts.sys.readFile)
  if (tsconfig_file.error != null) {
    return {failure: reportDiagnostics([tsconfig_file.error])}
  }

  const host: ts.ParseConfigHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    readDirectory: ts.sys.readDirectory,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
  }

  let preconfigure: ts.CompilerOptions = {}
  const {out_dir} = config
  if (out_dir != null) {
    if (typeof out_dir == "string")
      preconfigure = {outDir: out_dir}
    else
      preconfigure = {outDir: out_dir.js, declarationDir: out_dir.dts, declaration: true}
  }

  const tsconfig = ts.parseJsonConfigFileContent(tsconfig_file.config, host, dirname(tsconfig_path), preconfigure)
  if (tsconfig.errors.length != 0) {
    return {failure: reportDiagnostics(tsconfig.errors)}
  }

  return compileFiles(tsconfig.fileNames, tsconfig.options, config)
}

export function compileTypeScript(tsconfig: string, config: CompileConfig): boolean {
  const {outputs, failure} = compileProject(tsconfig, config)

  if (outputs != null) {
    for (const [file, content] of outputs)
      ts.sys.writeFile(file, content)
  }

  if (failure != null)
    config.log(`There were ${chalk.red("" + failure.count)} TypeScript errors:\n${failure.text}`)

  return failure == null
}
