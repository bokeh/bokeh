_ = require "underscore"

ColorMapper = require "./color_mapper"
p = require "../../core/properties"

class LinearColorMapper extends ColorMapper.Model
  type: "LinearColorMapper"

  @define {
      high:          [ p.Number           ]
      low:           [ p.Number           ]
      reserve_val:   [ p.Number           ]
      reserve_color: [ p.Color, '#ffffff' ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    if @get('reserve_color')?
      @_reserve_color = parseInt(@get('reserve_color').slice(1), 16)
      @_reserve_val   = @get('reserve_val')

  _get_values: (data, palette) ->
    min = @get('low') ? _.min(data)
    max = @get('high') ? _.max(data)
    interval = 1 / palette.length
    max_key = palette.length - 1
    values = []

    for d in data
      normed_d = (d - min) / (max - min)
      key = Math.floor(normed_d / interval)
      if key >= max_key
        key = max_key
      values.push(palette[key])
    return values

module.exports =
  Model: LinearColorMapper
