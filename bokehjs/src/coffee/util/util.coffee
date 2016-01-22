_  = require "underscore"
SPrintf = require "sprintf"
Numeral = require "numeral"

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

get_indices = (data_source) ->
  selected = data_source.get("selected")

  if selected['0d'].glyph
    selected['0d'].indices
  else if selected['1d'].indices.length > 0
    selected['1d'].indices
  else if selected['2d'].indices.length > 0
    selected['2d'].indices
  else
    []

map_vector_that_may_contain_patches_with_holes = (vector, map) ->
  # Possible inputs are:
  # [1, 2, 3]
  # [1, 2, NaN, 3, 4]
  # [[[1, 2], [3, 4]]]
  # [1, 2, NaN, [[1, 2], [3, 4]]]
  # Note: At the top level items are either a single value or an array of arrays
  if _.every(vector, _.isNumber)
    result = new Float64Array(vector.length)
  else
    result = []
  for i in [0...vector.length]
    if not _.isArray(vector[i])
      # Handle the easy case where it's a number or a NaN
      result[i] = map(vector[i])
    else
      # Alternatively the element must be an array of arrays (using isObject to
      # test for isFloat64Array)
      if _.every(vector[i], _.isObject)
        parent = []
        for j in [0...vector[i].length]
          child = new Float64Array(vector[i][j].length)
          for k in [0...vector[i][j].length]
            child[k] = map(vector[i][j][k])
          parent[j] = child
        result[i] = parent
      else
        throw new Error('Invalid data structure passed to v_vy_to_sy: ' + vector[i])
  return result

module.exports = {
  replace_placeholders: replace_placeholders
  get_indices: get_indices
  map_vector_that_may_contain_patches_with_holes: map_vector_that_may_contain_patches_with_holes
}
