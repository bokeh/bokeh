// The only module, which uses TypeScript's API (of TypeScript 6, because TypeScript 7
// doesn't have one yet). Others use options, configs and diagnostics through this module.
import ts from "typescript6"

import {basename, dirname, join} from "node:path"

import type {Path} from "./sys.js"

/** Returns the directory with TypeScript's `lib.*.d.ts` files for bokehjs in `bokehjs_dir`. */
export function default_lib_dir(bokehjs_dir: Path): Path {
  if (basename(bokehjs_dir) == "static") {
    return join(bokehjs_dir, "lib") // bokeh/server/static (see setup.py)
  } else {
    return join(dirname(bokehjs_dir), "node_modules", "typescript6", "lib") // bokehjs/build
  }
}

/** Compiler options that bokeh's compiler relies on (a subset of TypeScript's). */
export type CompilerOptions = {
  paths?: {[pattern: string]: string[]}
  outDir?: Path
  declarationDir?: Path
  noEmitOnError?: boolean
  sourceMap?: boolean
  declaration?: boolean
  declarationMap?: boolean
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
  options: CompilerOptions
  diagnostics?: undefined
}

export interface TSOutput {
  diagnostics?: Diagnostics
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

export function compiler_host(inputs: Inputs, options: CompilerOptions, tslib_dir?: Path): ts.CompilerHost {
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

export function compile_files(inputs: Path[], options: CompilerOptions, host?: ts.CompilerHost): TSOutput {
  const program = ts.createIncrementalProgram({rootNames: inputs, options, host})
  const emitted = program.emit()

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

export function parse_tsconfig(tsconfig_json: object, base_dir: Path, preconfigure?: CompilerOptions): TSConfig | Failed {
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

export function read_tsconfig(tsconfig_path: Path, preconfigure?: CompilerOptions): TSConfig | Failed {
  const tsconfig_file = ts.readConfigFile(tsconfig_path, ts.sys.readFile)
  if (tsconfig_file.error != null) {
    return {diagnostics: [tsconfig_file.error]}
  }

  return parse_tsconfig(tsconfig_file.config, dirname(tsconfig_path), preconfigure)
}
