import chalk from "chalk"
import * as ts from "typescript"

import {relative, dirname} from "path"

export function reportDiagnostics(diagnostics: ts.Diagnostic[]): string[] {
  const errors: string[] = []

  for (const diagnostic of diagnostics) {
    let message = `error TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`

    if (diagnostic.file) {
      const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!)
      const fileName = relative(process.cwd(), diagnostic.file.fileName)
      const fileMeta = `${fileName}(${line + 1},${character + 1}):`
      message = `${chalk.red(fileMeta)} ${message}`
    }

    errors.push(message)
  }

  return errors
}

export interface TSProduct {
  fileName: string
  data: string
}

export interface TSOutput {
  products?: TSProduct[]
  errors: string[]
}

export function compileFiles(fileNames: string[], options: ts.CompilerOptions): TSOutput {
  const program = ts.createProgram(fileNames, options)

  const products: TSProduct[] = []
  const emitResult = program.emit(undefined, (fileName: string, data: string) => {
    products.push({fileName, data})
  })

  const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics)
  const errors = reportDiagnostics(ts.sortAndDeduplicateDiagnostics(diagnostics))

  return {products, errors}
}

export type OutDir = string | {js: string, dts: string}

export function compileProject(tsconfig_path: string, out_dir?: OutDir): TSOutput {
  const config_file = ts.readConfigFile(tsconfig_path, ts.sys.readFile)
  if (config_file.error != null) {
    const errors = reportDiagnostics([config_file.error])
    return {errors}
  }

  const host: ts.ParseConfigHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    readDirectory: ts.sys.readDirectory,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
  }

  let preconfigure: ts.CompilerOptions = {}
  if (out_dir != null) {
    if (typeof out_dir == "string")
      preconfigure = {outDir: out_dir}
    else
      preconfigure = {outDir: out_dir.js, declarationDir: out_dir.dts, declaration: true}
  }

  const tsconfig = ts.parseJsonConfigFileContent(config_file.config, host, dirname(tsconfig_path), preconfigure)
  if (tsconfig.errors.length != 0) {
    const errors = reportDiagnostics(tsconfig.errors)
    return {errors}
  }

  return compileFiles(tsconfig.fileNames, tsconfig.options)
}

export interface CompileOptions {
  log: (message: string) => void
  out_dir?: OutDir
}

export function compileTypeScript(tsconfig: string, options: CompileOptions): boolean {
  const {products, errors} = compileProject(tsconfig, options.out_dir)

  for (const error of errors)
    options.log(error)

  if (errors.length != 0)
    options.log(`There were ${chalk.red("" + errors.length)} TypeScript errors.`)

  if (products != null) {
    for (const {fileName, data} of products)
      ts.sys.writeFile(fileName, data)
  }

  return errors.length == 0
}
