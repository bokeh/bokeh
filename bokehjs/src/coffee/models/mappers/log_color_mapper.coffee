_ = require "underscore"

ColorMapper = require "./color_mapper"
p = require "../../core/properties"

class LogColorMapper extends ColorMapper.Model
  type: "LogColorMapper"

  @define {
      high:          [ p.Number           ]
      low:           [ p.Number           ]
    }

  v_map_screen: (data) ->
    buf = new ArrayBuffer(data.length * 4)
    color = new Uint32Array(buf)

    low = @get('low') ? _.min(data)
    high = @get('high') ? _.max(data)
    palette = @get('computed_palette')

    N = palette.length - 1
    scale = N / (Math.log1p(high) - Math.log1p(low)) #substract the low offset

    if @get('little_endian')
      for i in [0...data.length]
        d = data[i]

        if (d > high)
          d = high
        else if (d < low)
          d = low

        log = Math.log1p(d) - Math.log1p(low) #substract the low offset
        value = palette[Math.floor(log * scale)]

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
        else if (d < low)
          d = low

        log = Math.log1p(d) - Math.log1p(low) #substract the low offset
        value = palette[Math.floor(log * scale)]

        color[i] = (value << 8) | 0xff                 # alpha
    return buf

module.exports =
  Model: LogColorMapper
