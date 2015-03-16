define [
  "underscore"
  "sprintf"
  "numeral"
], (_, SPrintf, Numeral) ->

  _format_number = (number) ->
    if _.isNumber(number)
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

  replace_placeholders = (string, data_source, i, special_vars={}) ->
    string = string.replace /(^|[^\$])\$(\w+)/g, (match, prefix, name) => "#{prefix}@$#{name}"

    string = string.replace /(^|[^@])@(?:(\$?\w+)|{([^{}]+)})(?:{([^{}]+)})?/g, (match, prefix, name, long_name, format) =>
      name = if long_name? then long_name else name

      value =
        if name[0] == "$"
          special_vars[name.substring(1)]
        else
          data_source.get_column(name)?[i]

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
