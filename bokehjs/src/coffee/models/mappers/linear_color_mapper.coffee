_ = require "underscore"

ColorMapper = require "./color_mapper"
p = require "../../core/properties"

class LinearColorMapper extends ColorMapper.Model
  type: "LinearColorMapper"

  @define {
      high:          [ p.Number           ]
      low:           [ p.Number           ]
      palette:       [ p.Any              ] # TODO (bev)
      reserve_val:   [ p.Number           ]
      reserve_color: [ p.Color, '#ffffff' ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @_little_endian = @_is_little_endian()
    @_palette       = @_build_palette(@get('palette'))
    if @get('reserve_color')?
      @_reserve_color = parseInt(@get('reserve_color').slice(1), 16)
      @_reserve_val   = @get('reserve_val')

  v_map_screen: (data) ->
    buf = new ArrayBuffer(data.length * 4)
    color = new Uint32Array(buf)

    low = @get('low') ? _.min(data)
    high = @get('high') ? _.max(data)

    N = @_palette.length - 1
    scale = N/(high-low)
    offset = -scale*low

    if @_little_endian
      for i in [0...data.length]
        d = data[i]

        if (d == @_reserve_val)
          value = @_reserve_color
        else
          if (d > high)
            d = high
          if (d < low)
            d = low
          value = @_palette[Math.floor(d*scale+offset)]

        color[i] =
          (0xff << 24)               | # alpha
          ((value & 0xff0000) >> 16) | # blue
          (value & 0xff00)           | # green
          ((value & 0xff) << 16);      # red

    else
      for i in [0...data.length]
        d = data[i]

        if (d == @_reserve_val)
          value = @_reserve_color
        else
          if (d > high)
            d = high
          if (d < low)
            d = low
          value = @_palette[Math.floor(d*scale+offset)] # rgb

        color[i] = (value << 8) | 0xff               # alpha

    return buf

module.exports =
  Model: LinearColorMapper
