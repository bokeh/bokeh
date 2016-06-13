_ = require "underscore"

ColorMapper = require "./color_mapper"
p = require "../../core/properties"

class LinearColorMapper extends ColorMapper.Model
  type: "LinearColorMapper"

  @define {
      high:          [ p.Number           ]
      low:           [ p.Number           ]
      palette:       [ p.Any              ] # TODO (bev)
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @_little_endian = @_is_little_endian()
    @_palette       = @_build_palette(@get('palette'))

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

        if (d > high)
          d = high
        if (d < low)
          d = low
        value = @_palette[Math.floor(d*scale+offset)] # rgb

        color[i] = (value << 8) | 0xff               # alpha

    return buf

  _build_palette: (palette) ->
    new_palette = new Uint32Array(palette.length+1)
    _convert = (value) ->
      if _.isNumber(value)
        return value
      else
        return parseInt(value.slice(1), 16)
    for i in [0...palette.length]
      new_palette[i] = _convert(palette[i])
    new_palette[new_palette.length-1] = _convert(palette[palette.length-1])
    return new_palette

module.exports =
  Model: LinearColorMapper
