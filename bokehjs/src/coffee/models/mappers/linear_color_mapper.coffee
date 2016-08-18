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
     low = @get('low') ? _.min(data)
     high = @get('high') ? _.max(data)

     N = palette.length
     scale = N/(high-low)
     offset = -scale*low
     values = []

     for i in [0...data.length]
       d = data[i]

       if (d == @_reserve_val)
         value = @_reserve_color
       else
         if (d > high)
           d = high
         if (d < low)
           d = low
         values[i] = palette[Math.floor(d*scale+offset)]
     return values

module.exports =
  Model: LinearColorMapper
