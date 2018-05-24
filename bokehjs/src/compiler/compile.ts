import * as fs from "fs"
import * as path from "path"
import * as ts from "typescript"
const coffee = require("coffeescript")
const less = require("less")
import {argv} from "yargs"

import {collect_deps} from "./dependencies"

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

const mkTypeScriptError = (diagnostic: ts.Diagnostic) => {
  let {line, character: column} = diagnostic.file!.getLineAndCharacterOfPosition(diagnostic.start!)
  line += 1
  column += 1
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  const text = [diagnostic.file!.fileName, line, column, message].join(":")
  return {message, line, column, text}
}

const reply = (data: any) => {
  process.stdout.write(JSON.stringify(data))
  process.stdout.write("\n")
}

const compile_and_resolve_deps = (input: {code: string, lang: string, file: string}) => {
  let code: string

  switch (input.lang) {
    case "coffeescript":
      try {
        code = coffee.compile(input.code, {bare: true, shiftLine: true})
      } catch (error) {
        return reply({error: mkCoffeescriptError(error, input.file)})
      }
      break;
    case "javascript":
    case "typescript":
      code = input.code
      break;
    case "less":
      const options = {
        paths: [path.dirname(input.file)],
        compress: true,
        ieCompat: false,
      }
      less.render(input.code, options, (error: any, output: any) => {
        if (error != null)
          reply({error: mkLessError(error, input.file)})
        else
          reply({code: output.css})
      })
      return
    default:
      throw new Error(`unsupported input type: ${input.lang}`)
  }

  const result = ts.transpileModule(code, {
    fileName: input.file,
    reportDiagnostics: true,
    compilerOptions: {
      noEmitOnError: false,
      noImplicitAny: false,
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.CommonJS,
    },
  })

  if (result.diagnostics != null && result.diagnostics.length > 0) {
    const diagnostic = result.diagnostics[0]
    return reply({error: mkTypeScriptError(diagnostic)})
  }

  code = result.outputText

  const source = ts.createSourceFile(input.file, code, ts.ScriptTarget.ES5, true, ts.ScriptKind.JS)
  const deps = collect_deps(source)

  return reply({code, deps})
}

if (argv.file != null) {
  const input = {
    code: fs.readFileSync(argv.file, "utf-8"),
    lang: argv.lang || "coffeescript",
    file: argv.file,
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
