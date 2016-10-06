import * as _ from "underscore"
p = require "../../core/properties"

ColorMapper = require "./color_mapper"


class LinearColorMapper extends ColorMapper.Model
  type: "LinearColorMapper"

  @define {
      high:       [ p.Number ]
      low:        [ p.Number ]
      high_color: [ p.Color  ]
      low_color:  [ p.Color  ]
    }

  _get_values: (data, palette) ->
    low = @low ? _.min(data)
    high = @high ? _.max(data)
    max_key = palette.length - 1
    values = []

    norm_factor = 1 / (high - low)
    normed_interval = 1 / palette.length

    for d in data
      if isNaN(d)
        values.push(@nan_color)
        continue

      # This handles the edge case where d == high, since the code below maps
      # values exactly equal to high to palette.length, which is greater than
      # max_key
      if d == high
        values.push(palette[max_key])
        continue

      normed_d = (d - low) * norm_factor
      key = Math.floor(normed_d / normed_interval)
      if key < 0
        if @low_color?
          values.push(@low_color)
        else
          values.push(palette[0])
      else if key > max_key
        if @high_color?
          values.push(@high_color)
        else
          values.push(palette[max_key])
      else
        values.push(palette[key])
    return values

module.exports =
  Model: LinearColorMapper
