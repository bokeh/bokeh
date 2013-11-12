exports.repeat = repeat = (string, count) ->
  Array(count + 1).join string

exports.indent = indent = (string, width) ->
  space = repeat " ", width
  lines = (space + line for line in string.split "\n")
  lines.join "\n"

exports.trim = trim = (string) ->
  string.replace(/^\s+/, "").replace(/\s+$/, "")
