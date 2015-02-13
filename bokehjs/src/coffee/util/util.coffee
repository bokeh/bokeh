define [
  "underscore"
  "sprintf"
  "numeral"
], (_, sprintf, Numeral) ->

  _format_number = (number) ->
    # will get strings for categorical types, just pass back
    if _.isString(number)
      return number
    if Math.floor(number) == number
      return sprintf("%d", number)
    if Math.abs(number) > 0.1 and Math.abs(number) < 1000
      return sprintf("%0.3f", number)
    return sprintf("%0.3e", number)

  replace_placeholders = (string, data_source, i, special_vars={}) ->
    # OBSOLETE {
    string = string.replace /(^|[^\$])\$(\w+)/g, (match, prefix, name) =>
      replacement = switch name
        when "index" then "#{i}"
        when "x"     then "#{_format_number(x)}"
        when "y"     then "#{_format_number(y)}"
        when "vx"    then "#{vx}"
        when "vy"    then "#{vy}"
        when "sx"    then "#{sx}"
        when "sy"    then "#{sy}"
      if replacement? then "#{prefix}#{replacement}" else match
    # }

    string = string.replace /(^|[^@])@(?:(\$?\w+)|{([^{}]+)})(?:{([^{}]+)})?/g, (match, prefix, name, long_name, format) =>
      name = if long_name? then long_name else name
      value =
        if name[0] == "$"
          special_vars[name.substring(1)]
        else
          column = data_source.get_column(name)
          if column? then column[i] else special_vars[name]
      replacement =
        if not value? then "???"
        else
          if format?
            Numeral.format(value, format)
          else
            _format_number(value)
      "#{prefix}#{_.escape(replacement)}"

    return string

  return {replace_placeholders: replace_placeholders}
