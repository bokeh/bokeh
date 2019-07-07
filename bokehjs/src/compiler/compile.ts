import * as path from "path"
import * as ts from "typescript"
const coffee = require("coffeescript")
const less = require("less")
import {argv} from "yargs"

import {read} from "./sys"
import {compileFiles, TSOutput, reportDiagnostics, Failure} from "./compiler"
import * as transforms from "./transforms"

const mkCoffeescriptError = (error: any, file?: string) => {
  const message = error.message

  if (error.location == null) {
    const text = [file || "<string>", message].join(":")
    return {message, text}
  } else {
    const location = error.location

    const line = location.first_line + 1
    const column = location.first_column + 1

    const text = [file || "<string>", line, column, message].join(":")

    let markerLen = 2
    if (location.first_line === location.last_line)
        markerLen += location.last_column - location.first_column

    const extract = error.code.split('\n')[line - 1]

    const annotated = [
      text,
      "  " + extract,
      "  " + Array(column).join(' ') + Array(markerLen).join('^'),
    ].join('\n')

    return {message, line, column, text, extract, annotated}
  }
}

const mkLessError = (error: any, file?: string) => {
  const message = error.message
  const line = error.line
  const column = error.column + 1
  const text = [file || "<string>", line, column, message].join(":")
  const extract = error.extract[line]
  const annotated = [text, "  " + extract].join("\n")
  return {message, line, column, text, extract, annotated}
}

const reply = (data: any) => {
  process.stdout.write(JSON.stringify(data))
  process.stdout.write("\n")
}

type Files = {[name: string]: string}

import tsconfig from "./tsconfig"

function compiler_options(bokehjs_dir: string): {options: ts.CompilerOptions, failure?: undefined} | {failure: Failure} {
  const host: ts.ParseConfigHost = {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,
    readDirectory: ts.sys.readDirectory,
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
  }

  const preconfigure: ts.CompilerOptions = {
    paths: {
      "*": [
        path.join(bokehjs_dir, "js/lib/*"),
        path.join(bokehjs_dir, "js/types/*"),
      ],
    },
  }

  const {errors, options} = ts.parseJsonConfigFileContent(tsconfig, host, ".", preconfigure)
  if (errors.length != 0)
    return {failure: reportDiagnostics(errors)}
  else
    return {options}
}

function compiler_host(inputs: Files, options: ts.CompilerOptions, bokehjs_dir: string): ts.CompilerHost {
  const default_host = ts.createCompilerHost(options)

  return {
    ...default_host,
    getDefaultLibLocation: () => {
      // bokeh/server/static or bokehjs/build
      if (path.basename(bokehjs_dir) == "static")
        return path.join(bokehjs_dir, "lib")
      else
        return path.join(path.dirname(bokehjs_dir), "node_modules/typescript/lib")
    },
    fileExists(name: string): boolean {
      return inputs[name] != null || default_host.fileExists(name)
    },
    readFile(name: string): string | undefined {
      return inputs[name] != null ? inputs[name] : default_host.readFile(name)
    },
    getSourceFile(name: string, target: ts.ScriptTarget, _onError?: (message: string) => void) {
      if (inputs[name] != null)
        return ts.createSourceFile(name, inputs[name], target)
      else
        return default_host.getSourceFile(name, target, _onError)
    },
  }
}

function compile_typescript(inputs: Files, bokehjs_dir: string): TSOutput {
  const tsconfig = compiler_options(bokehjs_dir)
  if (tsconfig.failure != null)
    return {failure: tsconfig.failure}
  const host = compiler_host(inputs, tsconfig.options, bokehjs_dir)
  const config = {log: (text: string) => console.log(text)}
  return compileFiles(Object.keys(inputs), tsconfig.options, config, host)
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

const compile_and_resolve_deps = (input: {code: string, lang: string, file: string, bokehjs_dir: string}) => {
  const {file, lang, bokehjs_dir} = input
  let {code} = input

  let output: string
  switch (lang) {
    case "typescript":
      const inputs = {[normalize(file)]: code}
      const result = compile_typescript(inputs, bokehjs_dir)

      if (result.failure == null) {
        const js_file = normalize(rename(file, {ext: ".js"}))
        output = result.outputs!.get(js_file)!
      } else
        return reply({error: result.failure})
      break
    case "coffeescript":
      try {
        code = coffee.compile(code, {bare: true, shiftLine: true})
      } catch (error) {
        return reply({error: mkCoffeescriptError(error, file)})
      }
    case "javascript": {
      const result = compile_javascript(file, code)
      if (result.error == null)
        output = result.output
      else
        return reply({error: result.error})
      break
    }
    case "less":
      const options = {
        paths: [path.dirname(file)],
        compress: true,
        ieCompat: false,
      }
      less.render(code, options, (error: any, output: any) => {
        if (error != null)
          reply({error: mkLessError(error, file)})
        else
          reply({code: output.css})
      })
      return
    default:
      throw new Error(`unsupported input type: ${lang}`)
  }

  const source = ts.createSourceFile(file, output, ts.ScriptTarget.ES5, true, ts.ScriptKind.JS)
  const deps = transforms.collect_deps(source)

  return reply({code: output, deps})
}

if (argv.file != null) {
  const input = {
    code: argv.code != null ? argv.code as string : read(argv.file as string)!,
    lang: (argv.lang as string | undefined) || "coffeescript",
    file: argv.file as string,
    bokehjs_dir: (argv.bokehjsDir as string | undefined) || "./build", // this is what bokeh.settings defaults to
  }
  compile_and_resolve_deps(input)
} else {
  const stdin = process.stdin

  stdin.resume()
  stdin.setEncoding("utf-8")

  let data = ""

  stdin.on("data", (chunk: string) => data += chunk)
  stdin.on("end", () => compile_and_resolve_deps(JSON.parse(data)))
}
