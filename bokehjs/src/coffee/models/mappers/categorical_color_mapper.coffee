_ = require "underscore"
p = require "../../core/properties"

ColorMapper = require "./color_mapper"


class CategoricalColorMapper extends ColorMapper.Model
  type: "CategoricalColorMapper"

  @define {
    factors:  [ p.Array, [] ]
  }

  _get_values: (data, palette) ->
    values = []

    for d in data
      key = @factors.indexOf(d)
      if key < 0
        color = @nan_color
      else
        color = palette[key]
      values.push(color)
    return values

module.exports =
  Model: CategoricalColorMapper
