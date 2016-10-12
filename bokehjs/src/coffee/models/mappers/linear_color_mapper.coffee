import * as _ from "underscore"
import * as p from "../../core/properties"

import {ColorMapper} from "./color_mapper"

export class LinearColorMapper extends ColorMapper
  type: "LinearColorMapper"

  @define {
      high:       [ p.Number ]
      low:        [ p.Number ]
      high_color: [ p.Color  ]
      low_color:  [ p.Color  ]
    }

  _get_values: (data, palette, image_glyph=false) ->
    low = @low ? _.min(data)
    high = @high ? _.max(data)
    max_key = palette.length - 1
    values = []

    nan_color = if image_glyph then @_build_palette([@nan_color])[0] else @nan_color

    norm_factor = 1 / (high - low)
    normed_interval = 1 / palette.length

    for d in data
      if isNaN(d)
        values.push(nan_color)
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
          # low_color = if image_glyph then @_build_palette([@low_color])[0] else @low_color
          low_color = 4276128512
          values.push(low_color)
        else
          values.push(palette[0])
      else if key > max_key
        if @high_color?
          high_color = if image_glyph then @_build_palette([@high_color])[0] else @high_color
          values.push(high_color)
        else
          values.push(palette[max_key])
      else
        values.push(palette[key])
    return values
