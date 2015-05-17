_ = require "underscore"
HasProperties = require "../common/has_properties"

class LinearColorMapper extends HasProperties

  initialize: (attrs, options) ->
    super(attrs, options)
    @palette       = @_build_palette(@get('palette'))
    @little_endian = @_is_little_endian()
    if @get('reserve_color')?
      @reserve_color = parseInt(@get('reserve_color').slice(1), 16)
      @reserve_val   = @get('reserve_val')

  v_map_screen: (data) ->
    buf = new ArrayBuffer(data.length * 4)
    color = new Uint32Array(buf)

    low = @get('low') ? _.min(data)
    high = @get('high') ? _.max(data)

    N = @palette.length - 1
    scale = N/(high-low)
    offset = -scale*low

    if @little_endian
      for i in [0...data.length]
        d = data[i]

        if (d == @reserve_val)
          value = @reserve_color
        else
          if (d > high)
            d = high
          if (d < low)
            d = low
          value = @palette[Math.floor(d*scale+offset)]

        color[i] =
          (0xff << 24)               | # alpha
          ((value & 0xff0000) >> 16) | # blue
          (value & 0xff00)           | # green
          ((value & 0xff) << 16);      # red

    else
      for i in [0...data.length]
        d = data[i]
        if (d == @reserve_val)
          value = @reserve_color
        else
          if (d > high)
            d = high
          if (d < low)
            d = low
          value = @palette[Math.floor(d*scale+offset)] # rgb

        color[i] = (value << 8) | 0xff               # alpha

    return buf

  _is_little_endian: () ->
    buf = new ArrayBuffer(4)
    buf8 = new Uint8ClampedArray(buf)
    buf32 = new Uint32Array(buf)
    buf32[1] = 0x0a0b0c0d

    little_endian = true
    if (buf8[4]==0x0a && buf8[5]==0x0b && buf8[6]==0x0c && buf8[7]==0x0d)
      little_endian = false
    return little_endian

  _build_palette: (palette) ->
    new_palette = new Uint32Array(palette.length+1)
    for i in [0...palette.length]
      if _.isNumber(palette[i])
        new_palette[i] = palette[i]
      else
        new_palette[i] = parseInt(palette[i].slice(1), 16)
    new_palette[new_palette.length-1] = palette[palette.length-1]
    return new_palette

module.exports =
  Model: LinearColorMapper,