_ = require "underscore"
p = require "../../core/properties"

Model = require "../../model"

class ColorMapper extends Model
  type: "ColorMapper"

  @define {
      palette:       [ p.Any              ] # TODO (bev)
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @_little_endian = @_is_little_endian()
    @_palette       = @_build_palette(@get('palette'))

    @listenTo(this, 'change', () ->
      @_palette = @_build_palette(@get('palette')))

  v_map_screen: (data) ->
    return null

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
  Model: ColorMapper
