import chalk from "chalk"
import ts from "typescript"

import {dirname, join, relative} from "path"

import * as transforms from "./transforms"
import type {Path} from "./sys"
import {BuildError} from "./error"

export type CompileConfig = {
  tslib_dir?: Path
  inputs?(files: Path[]): Inputs
}

export type Inputs = Map<Path, string>

export type Outputs = Map<Path, string>

export type Diagnostics = readonly ts.Diagnostic[]

export type Failed = {
  diagnostics: Diagnostics
}

export function is_failed<T>(obj: T | Partial<Failed>): obj is Failed {
  return typeof obj == "object" && obj != null && "diagnostics" in obj && obj.diagnostics != null
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

export function compiler_host(inputs: Inputs, options: ts.CompilerOptions, tslib_dir?: Path): ts.CompilerHost {
  const default_host = ts.createIncrementalCompilerHost(options)

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
      if (source != null) {
        const sf = ts.createSourceFile(name, source, target)
        const version = default_host.createHash!(source)
        return {...sf, version} as any // version is internal to the compiler
      } else {
        return default_host.getSourceFile(name, target, _onError)
      }
    },
  }

  if (tslib_dir != null) {
    host.getDefaultLibLocation = () => tslib_dir
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

  const base = options.baseUrl
  if (base != null) {
    const relativize_modules = transforms.relativize_modules((file, module_path) => {
      if (!module_path.startsWith(".") && !module_path.startsWith("/")) {
        const module_file = join(base, module_path)
        if (ts.sys.fileExists(module_file) ||
            ts.sys.fileExists(`${module_file}.ts`) ||
            ts.sys.fileExists(join(module_file, "index.ts")) ||
            options.outDir != null && ts.sys.fileExists(join(options.outDir, `${module_path}.js`))) {
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
  const program = ts.createIncrementalProgram({rootNames: inputs, options, host})
  const emitted = program.emit(undefined, undefined, undefined, false, transformers)

  const diagnostics = [
    ...program.getConfigFileParsingDiagnostics(),
    ...program.getSyntacticDiagnostics(),
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...program.getSemanticDiagnostics(),
    ...emitted.diagnostics,
  ]

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
  const tsconfig = read_tsconfig(tsconfig_path)
  if (is_failed(tsconfig)) {
    return {diagnostics: tsconfig.diagnostics}
  }

  const {files, options} = tsconfig

  const transformers = default_transformers(tsconfig.options)
  const inputs = config.inputs?.(files) ?? new Map()
  const host = compiler_host(inputs, options, config.tslib_dir)

  const input_files = [...inputs.keys(), ...files]
  return compile_files(input_files, options, transformers, host)
}

export function compile_typescript(tsconfig_path: Path, config: CompileConfig = {}): void {
  const result = compile_project(tsconfig_path, config)

  if (is_failed(result)) {
    const {count, text} = report_diagnostics(result.diagnostics)
    throw new BuildError("typescript", `There were ${chalk.red(`${count}`)} TypeScript errors:\n${text}`)
  }
}
