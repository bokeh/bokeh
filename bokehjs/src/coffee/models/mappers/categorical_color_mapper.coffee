import * as _ from "underscore"
import * as p from "../../core/properties"

import * as ColorMapper from "./color_mapper"


class CategoricalColorMapper extends ColorMapper.Model
  type: "CategoricalColorMapper"

  @define {
    factors:  [ p.Array ]
  }

  _get_values: (data, palette) ->
    values = []

    for d in data
      key = @factors.indexOf(d)
      if key < 0 or key >= palette.length
        color = @nan_color
      else
        color = palette[key]
      values.push(color)
    return values

module.exports =
  Model: CategoricalColorMapper
