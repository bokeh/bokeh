_ = require "underscore"

ColorMapper = require "./color_mapper"


class LogColorMapper extends ColorMapper.Model
  type: "LogColorMapper"

  _get_values: (data, palette) ->
    n = palette.length + 1
    low = @get('low') ? _.min(data)
    high = @get('high') ? _.max(data)
    scale = n / (Math.log1p(high) - Math.log1p(low))  # subtract the low offset
    max_key = palette.length - 1
    values = []

    for d in data
      if _.isNaN(d)
        values.push(@nan_color)
        continue
      # Clamp the data
      if (d >= high)
        d = high
      else if (d < low)
        d = low

      # Get the key
      log = Math.log1p(d) - Math.log1p(low)  # subtract the low offset
      key = Math.floor(log * scale)
      if key > max_key
        key = max_key
      values.push(palette[key])
    return values

module.exports =
  Model: LogColorMapper
