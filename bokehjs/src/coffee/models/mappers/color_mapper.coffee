import * as p from "core/properties"

import {Model} from "../../model"
import {isNumber} from "core/util/types"

export class ColorMapper extends Model
  type: "ColorMapper"

  @define {
      palette:       [ p.Any              ] # TODO (bev)
      nan_color:     [ p.Color, "gray"    ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)
    @_little_endian = @_is_little_endian()
    @_palette       = @_build_palette(@palette)

    @listenTo(this, 'change', () ->
      @_palette = @_build_palette(@palette)
    )

  v_map_screen: (data, image_glyph=false) ->
    values = @_get_values(data, @_palette, image_glyph)
    buf = new ArrayBuffer(data.length * 4)
    color = new Uint32Array(buf)

    if @_little_endian
      for i in [0...data.length]
        value = values[i]
        color[i] =
          (0xff << 24)                   | # alpha
          ((value & 0xff0000) >> 16)     | # blue
          (value & 0xff00)               | # green
          ((value & 0xff) << 16);          # red
    else
      for i in [0...data.length]
        value = values[i]
        color[i] = (value << 8) | 0xff     # alpha
    return buf

  compute: (x) ->
    # If it's just a single value, then a color mapper doesn't
    # really make sense, so return nothing
    return null

  v_compute: (xs) ->
    values = @_get_values(xs, @palette)
    return values

  _get_values: (data, palette, image_glyph=false) ->
    # Should be defined by subclass
    return []

  _is_little_endian: () ->
    buf = new ArrayBuffer(4)
    buf8 = new Uint8Array(buf)
    buf32 = new Uint32Array(buf)
    buf32[1] = 0x0a0b0c0d

    little_endian = true
    if (buf8[4]==0x0a && buf8[5]==0x0b && buf8[6]==0x0c && buf8[7]==0x0d)
      little_endian = false
    return little_endian

  _build_palette: (palette) ->
    new_palette = new Uint32Array(palette.length)
    _convert = (value) ->
      if isNumber(value)
        return value
      else
        return parseInt(value.slice(1), 16)
    for i in [0...palette.length]
      new_palette[i] = _convert(palette[i])
    return new_palette
