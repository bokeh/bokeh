import * as p from "core/properties"

import {color2hex} from "core/util/color"
import {min, max} from "core/util/array"
import {ColorMapper} from "./color_mapper"

# Math.log1p() is not supported by any version of IE, so let's use a polyfill based on
# https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log1p.
log1p = Math.log1p ? (x) -> Math.log(1 + x)

export class LogColorMapper extends ColorMapper
  type: "LogColorMapper"

  @define {
      high:       [ p.Number ]
      low:        [ p.Number ]
      high_color: [ p.Color  ]
      low_color:  [ p.Color  ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @_nan_color = @_build_palette([color2hex(@nan_color)])[0]
    @_high_color = if @high_color? then @_build_palette([color2hex(@high_color)])[0]
    @_low_color = if @low_color? then @_build_palette([color2hex(@low_color)])[0]

  _get_values: (data, palette, image_glyph=false) ->
    n = palette.length
    low = @low ? min(data)
    high = @high ? max(data)
    scale = n / (log1p(high) - log1p(low))  # subtract the low offset
    max_key = palette.length - 1
    values = []

    nan_color = if image_glyph then @_nan_color else @nan_color
    high_color = if image_glyph then @_high_color else @high_color
    low_color = if image_glyph then @_low_color else @low_color

    for d in data
      # Check NaN
      if isNaN(d)
        values.push(nan_color)
        continue

      if d > high
        if @high_color?
          values.push(high_color)
        else
          values.push(palette[max_key])
        continue

      # This handles the edge case where d == high, since the code below maps
      # values exactly equal to high to palette.length, which is greater than
      # max_key
      if d == high
        values.push(palette[max_key])
        continue

      if d < low
        if @low_color?
          values.push(low_color)
        else
          values.push(palette[0])
        continue

      # Get the key
      log = log1p(d) - log1p(low)  # subtract the low offset
      key = Math.floor(log * scale)

      # Deal with upper bound
      if key > max_key
        key = max_key

      values.push(palette[key])
    return values
