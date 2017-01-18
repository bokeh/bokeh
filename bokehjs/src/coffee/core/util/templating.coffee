import * as SPrintf from "sprintf"
import * as Numbro from "numbro"
import {escape} from "./string"
import {isNumber} from "./types"

_format_number = (number) ->
  if isNumber(number)
    format = switch
      when Math.floor(number) == number
        "%d"
      when Math.abs(number) > 0.1 and Math.abs(number) < 1000
        "%0.3f"
      else
        "%0.3e"

    return SPrintf.sprintf(format, number)
  else
    return "#{number}" # get strings for categorical types

export replace_placeholders = (string, data_source, i, special_vars = {}) ->
  string = string.replace /(^|[^\$])\$(\w+)/g, (match, prefix, name) => "#{prefix}@$#{name}"

  string = string.replace /(^|[^@])@(?:(\$?\w+)|{([^{}]+)})(?:{([^{}]+)})?/g, (match, prefix, name, long_name, format) =>
    name = if long_name? then long_name else name

    value =
      if name[0] == "$"
        special_vars[name.substring(1)]
      else
        data_source.get_column(name)?[i]

    replacement = null
    if not value?
      replacement = "???"
    else
      if format == 'safe'
        return "#{prefix}#{value}"
      else if format?
        replacement = Numbro.format(value, format)
      else
        replacement = _format_number(value)
    replacement = "#{prefix}#{escape(replacement)}"

  return string
