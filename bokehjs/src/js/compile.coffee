path = require "path"
acorn = require "acorn"
coffee = require "coffee-script"
detective = require "detective"
jslint = require "jslint"
less = require "less"
eco = require "../../gulp/eco"

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

mkAcornError = (error, file) ->
  message = error.message.replace(/\s*\(\d+:\d+\)\s*$/, "")
  line = error.loc.line
  column = error.loc.column
  text = [file ? "<string>", line, column, message].join(":")

  return {
    message: message
    line: line
    column: column
    text: text
  }

stdin = process.stdin
stdout = process.stdout

stdin.resume()
stdin.setEncoding("utf8")

reply = (data) ->
  stdout.write(JSON.stringify(data))
  stdout.write("\n")

data = ""

stdin.on "data", (chunk) -> data += chunk
stdin.on "end", () ->
  input = JSON.parse(data)

  switch input.lang
    when "coffeescript"
      try
        code = coffee.compile(input.code, {bare: true, shiftLine: true})
      catch error
        return reply({error: mkCoffeescriptError(error, input.file)})
    when "javascript"
      code = input.code
    when "eco"
      try
        code = "module.exports = #{eco.compile(input.code)};"
      catch error
        return reply({error: mkCoffeescriptError(error, input.file)})
    when "less"
      options = {
        paths: [path.dirname(input.file)]
        compress: true
      }
      return less.render input.code, options, (error, output) ->
        if error?
          reply({error: mkLessError(error, input.file)})
        else
          reply({code: output.css})
    else
      throw new Error("unsupported input type: #{input.lang}")

  try
    acorn.parse(code, {})
  catch error
    return reply({error: mkAcornError(error, input.file)})

  try
    deps = detective(code)
  catch error
    return reply({error: error})

  return reply({ code: code, deps: deps })
