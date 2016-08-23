_ = require "underscore"

ColorMapper = require "./color_mapper"


class LinearColorMapper extends ColorMapper.Model
  type: "LinearColorMapper"

  _get_values: (data, palette) ->
    min = @get('low') ? _.min(data)
    max = @get('high') ? _.max(data)
    interval = 1 / palette.length
    max_key = palette.length - 1
    values = []

    norm_factor = 1 / (max - min)

    for d in data
      normed_d = (d - min) * norm_factor
      key = Math.floor(normed_d / interval)
      if _.isNaN(d)
        values.push(@nan_color)
        continue
      else if key < 0
        key = 0
      else if key >= max_key
        key = max_key
      values.push(palette[key])
    return values

module.exports =
  Model: LinearColorMapper
