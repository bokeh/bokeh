_ = require "underscore"
fs = require "fs"
path = require "path"
ts = require "typescript"
coffee = require "coffee-script"
detective = require "detective"
jslint = require "jslint"
less = require "less"
argv = require("yargs").argv

mkCoffeescriptError = (error, file) ->
  message = error.message

  if not error.location?
    text = [file ? "<string>", message].join(":")
  else
    location = error.location

    line = location.first_line + 1
    column = location.first_column + 1

    text = [file ? "<string>", line, column, message].join(":")

    markerLen = 2
    if location.first_line == location.last_line
        markerLen += location.last_column - location.first_column

    extract = error.code.split('\n')[line - 1]

    annotated = [
        text,
        "  " + extract
        "  " + Array(column).join(' ') + Array(markerLen).join('^'),
    ].join('\n')

  return {
    message: message
    line: line
    column: column
    text: text
    extract: extract
    annotated: annotated
  }

mkLessError = (error, file) ->
  message = error.message
  line = error.line
  column = error.column + 1
  text = [file ? "<string>", line, column, message].join(":")
  extract = error.extract[line]
  annotated = [text, "  " + extract].join("\n")

  return {
    message: message
    line: line
    column: column
    text: text
    extract: extract
    annotated: annotated
  }

mkTypeScriptError = (diagnostic) ->
  {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
  [line, column] = [line+1, character+1]
  message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
  text = [diagnostic.file.fileName, line, column, message].join(":")
  return {
    message: message
    line: line
    column: column
    text: text
  }

stdin = process.stdin
stdout = process.stdout

reply = (data) ->
  stdout.write(JSON.stringify(data))
  stdout.write("\n")

compile_and_resolve_deps = (input) ->
  switch input.lang
    when "coffeescript"
      try
        code = coffee.compile(input.code, {bare: true, shiftLine: true})
      catch error
        return reply({error: mkCoffeescriptError(error, input.file)})
    when "javascript", "typescript"
      code = input.code
    when "less"
      options = {
        paths: [path.dirname(input.file)]
        compress: true
        ieCompat: false
      }
      return less.render input.code, options, (error, output) ->
        if error?
          reply({error: mkLessError(error, input.file)})
        else
          reply({code: output.css})
    else
      throw new Error("unsupported input type: #{input.lang}")

  result = ts.transpileModule(code, {
    fileName: input.file,
    reportDiagnostics: true
    compilerOptions: {
      noEmitOnError: false
      noImplicitAny: false
      target: ts.ScriptTarget.ES5
      module: ts.ModuleKind.CommonJS
      jsx: "react"
      reactNamespace: "DOM"
    }
  })

  if _.isArray(result.diagnostics) and result.diagnostics.length > 0
    diagnostic = result.diagnostics[0]
    return reply({error: mkTypeScriptError(diagnostic)})

  code = result.outputText

  try
    deps = detective(code)
  catch error
    return reply({error: error})

  return reply({ code: code, deps: deps })

if argv.file?
  input = {
    code: fs.readFileSync(argv.file, 'utf-8')
    lang: argv.lang ? "coffeescript"
    file: argv.file
  }
  compile_and_resolve_deps(input)
else
  stdin.resume()
  stdin.setEncoding("utf8")

  data = ""

  stdin.on "data", (chunk) -> data += chunk
  stdin.on "end", () ->
    input = JSON.parse(data)
    compile_and_resolve_deps(input)
