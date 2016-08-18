_ = require "underscore"

ColorMapper = require "./color_mapper"
p = require "../../core/properties"

class LogColorMapper extends ColorMapper.Model
  type: "LogColorMapper"

  @define {
      high:          [ p.Number           ]
      low:           [ p.Number           ]
    }

  _get_values: (data, palette) ->
     low = @get('low') ? _.min(data)
     high = @get('high') ? _.max(data)
     N = @_palette.length - 1
     scale = N / (Math.log1p(high) - Math.log1p(low))  # subtract the low offset
     values = []

     for i in [0...data.length]
       d = data[i]

       if (d > high)
         d = high
       else if (d < low)
         d = low

       log = Math.log1p(d) - Math.log1p(low)  # subtract the low offset
       values[i] = palette[Math.floor(log * scale)]
     return values

module.exports =
  Model: LogColorMapper
