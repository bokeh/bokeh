_ = require "underscore"
p = require "../../core/properties"

ColorMapper = require "./color_mapper"


class LinearColorMapper extends ColorMapper.Model
  type: "LinearColorMapper"

  @define {
      high:          [ p.Number           ]
      low:           [ p.Number           ]
    }

  _get_values: (data, palette) ->
    min = @get('low') ? _.min(data)
    max = @get('high') ? _.max(data)
    max_key = palette.length - 1
    values = []

    norm_factor = 1 / (max - min)
    normed_interval = 1 / palette.length

    for d in data
      if isNaN(d)
        values.push(@nan_color)
        continue

      normed_d = (d - min) * norm_factor
      key = Math.floor(normed_d / normed_interval)
      if key < 0
        key = 0
      else if key >= max_key
        key = max_key
      values.push(palette[key])
    return values

module.exports =
  Model: LinearColorMapper
