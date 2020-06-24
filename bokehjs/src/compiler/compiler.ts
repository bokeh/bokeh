import chalk from "chalk"
import * as ts from "typescript"

import {basename, dirname, join, relative} from "path"

import * as transforms from "./transforms"
import {Path} from "./sys"
import {BuildError} from "./error"

export type CompileConfig = {
  out_dir?: OutDir
  bokehjs_dir?: Path
}

export type Inputs = Map<Path, string>

export type Outputs = Map<Path, string>

export type Diagnostics = readonly ts.Diagnostic[]

export type Failed = {
  diagnostics: Diagnostics
}

export function is_failed<T>(obj: T | Failed): obj is Failed {
  return "diagnostics" in obj && obj.diagnostics != null
}

export type TSConfig = {
  files: Path[]
  options: ts.CompilerOptions
  diagnostics?: undefined
}

export interface TSOutput {
  diagnostics?: Diagnostics
}

function normalize(path: Path): Path {
  return path.replace(/\\/g, "/")
}

const diagnostics_host: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
}

export function report_diagnostics(diagnostics: Diagnostics): {count: number, text: string} {
  const errors = ts.sortAndDeduplicateDiagnostics(diagnostics)
  const text = ts.formatDiagnosticsWithColorAndContext(errors, diagnostics_host)
  return {count: errors.length, text}
}

export function compiler_host(inputs: Inputs, options: ts.CompilerOptions, bokehjs_dir?: Path): ts.CompilerHost {
  const default_host = ts.createCompilerHost(options)

  const host = {
    ...default_host,
    fileExists(name: Path): boolean {
      return inputs.get(name) != null || default_host.fileExists(name)
    },
    readFile(name: Path): string | undefined {
      return inputs.get(name) != null ? inputs.get(name) : default_host.readFile(name)
    },
    getSourceFile(name: Path, target: ts.ScriptTarget, _onError?: (message: string) => void): ts.SourceFile | undefined {
      const source = inputs.get(name)
      if (source != null)
        return ts.createSourceFile(name, source, target)
      else
        return default_host.getSourceFile(name, target, _onError)
    },
  }

  if (bokehjs_dir != null) {
    host.getDefaultLibLocation = () => {
      // bokeh/server/static or bokehjs/build
      if (basename(bokehjs_dir) == "static")
        return join(bokehjs_dir, "lib")
      else
        return join(dirname(bokehjs_dir), "node_modules/typescript/lib")
    }
  }

  return host
}

export function default_transformers(options: ts.CompilerOptions): ts.CustomTransformers {
  const transformers: Required<ts.CustomTransformers> = {
    before: [],
    after: [],
    afterDeclarations: [],
  }

  const insert_class_name = transforms.insert_class_name()
  transformers.before.push(insert_class_name)

  const add_init_class = transforms.add_init_class()
  transformers.before.push(add_init_class)

  const base = options.baseUrl
  if (base != null) {
    const relativize_modules = transforms.relativize_modules((file, module_path) => {
      if (!module_path.startsWith(".") && !module_path.startsWith("/")) {
        const module_file = join(base, module_path)
        if (ts.sys.fileExists(module_file) ||
            ts.sys.fileExists(module_file + ".ts") ||
            ts.sys.fileExists(join(module_file, "index.ts")) ||
            options.outDir != null && ts.sys.fileExists(join(options.outDir, module_path + ".js"))) {
          const rel_path = normalize(relative(dirname(file), module_file))
          return rel_path.startsWith(".") ? rel_path : `./${rel_path}`
        }
      }
      return null
    })

    transformers.after.push(relativize_modules)
    transformers.afterDeclarations.push(relativize_modules)
  }

  return transformers
}

export function compile_files(inputs: Path[], options: ts.CompilerOptions, transformers?: ts.CustomTransformers, host?: ts.CompilerHost): TSOutput {
  const program = ts.createProgram(inputs, options, host)
  const emitted = program.emit(undefined, undefined, undefined, false, transformers)

  const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitted.diagnostics)
  return diagnostics.length != 0 ? {diagnostics} : {}
}

export type OutDir = Path | {js: Path, dts: Path}

export function parse_tsconfig(tsconfig_json: object, base_dir: Path, preconfigure?: ts.CompilerOptions): TSConfig | Failed {
  const host: ts.ParseConfigHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    readDirectory: ts.sys.readDirectory,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
  }

  const tsconfig = ts.parseJsonConfigFileContent(tsconfig_json, host, base_dir, preconfigure)
  if (tsconfig.errors.length != 0) {
    return {diagnostics: tsconfig.errors}
  }

  return {files: tsconfig.fileNames, options: tsconfig.options}
}

export function read_tsconfig(tsconfig_path: Path, preconfigure?: ts.CompilerOptions): TSConfig | Failed {
  const tsconfig_file = ts.readConfigFile(tsconfig_path, ts.sys.readFile)
  if (tsconfig_file.error != null) {
    return {diagnostics: [tsconfig_file.error]}
  }

  return parse_tsconfig(tsconfig_file.config, dirname(tsconfig_path), preconfigure)
}

function compile_project(tsconfig_path: Path, config: CompileConfig): TSOutput {
  const preconfigure: ts.CompilerOptions = (() => {
    const {out_dir} = config
    if (out_dir != null) {
      if (typeof out_dir == "string")
        return {outDir: out_dir}
      else
        return {outDir: out_dir.js, declarationDir: out_dir.dts, declaration: true}
    } else
      return {}
  })()

  const tsconfig = read_tsconfig(tsconfig_path, preconfigure)
  if (is_failed(tsconfig))
    return {diagnostics: tsconfig.diagnostics}

  const {files, options} = tsconfig

  const transformers = default_transformers(tsconfig.options)
  const host = compiler_host(new Map(), options, config.bokehjs_dir)

  return compile_files(files, options, transformers, host)
}

export function compile_typescript(tsconfig_path: Path, config: CompileConfig = {}): void {
  const result = compile_project(tsconfig_path, config)

  if (is_failed(result)) {
    const {count, text} = report_diagnostics(result.diagnostics)
    throw new BuildError("typescript", `There were ${chalk.red("" + count)} TypeScript errors:\n${text}`)
  }
}
