_ = require "underscore"
p = require "../../core/properties"

ColorMapper = require "./color_mapper"


class LogColorMapper extends ColorMapper.Model
  type: "LogColorMapper"

  @define {
      high:       [ p.Number ]
      low:        [ p.Number ]
      high_color: [ p.Color  ]
      low_color:  [ p.Color  ]
    }

  _get_values: (data, palette) ->
    n = palette.length
    low = @low ? _.min(data)
    high = @high ? _.max(data)
    scale = n / (Math.log1p(high) - Math.log1p(low))  # subtract the low offset
    max_key = palette.length - 1
    values = []

    for d in data
      # Check NaN
      if isNaN(d)
        values.push(@nan_color)
        continue

      if d > high
        if @high_color?
          values.push(@high_color)
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
          values.push(@low_color)
        else
          values.push(palette[0])
        continue

      # Get the key
      log = Math.log1p(d) - Math.log1p(low)  # subtract the low offset
      key = Math.floor(log * scale)

      # Deal with upper bound
      if key > max_key
        key = max_key

      values.push(palette[key])
    return values

module.exports =
  Model: LogColorMapper
