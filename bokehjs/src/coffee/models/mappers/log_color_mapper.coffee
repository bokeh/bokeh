_ = require "underscore"

ColorMapper = require "./color_mapper"
p = require "../../core/properties"
{get_base_log} = require "../../core/util/math"

class LogColorMapper extends ColorMapper.Model
  type: "LogColorMapper"

  @define {
      high:          [ p.Number           ]
      low:           [ p.Number           ]
      palette:       [ p.Any              ] # TODO (bev)
      log_base:      [ p.Number,    10    ]
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
    scale = N / get_base_log(high - low, @get('log_base'))

    if @_little_endian
      for i in [0...data.length]
        d = data[i]

        if (d > high)
          d = high
        if (d < low)
          d = low
     
        log = get_base_log(d - low, @get('log_base'))
        value = @_palette[Math.floor(log * scale)]

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
        log = get_base_log(d - low, @get('log_base'))
        value = @_palette[Math.floor(log * scale)]     # rgb

        color[i] = (value << 8) | 0xff                 # alpha

    return buf

module.exports =
  Model: LogColorMapper
