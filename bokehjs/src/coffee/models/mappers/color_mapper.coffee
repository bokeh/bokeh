_ = require "underscore"

Model = require "../../model"

class ColorMapper extends Model
  type: "ColorMapper"

  initialize: (attrs, options) ->
    super(attrs, options)

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
    return null

module.exports =
  Model: ColorMapper
