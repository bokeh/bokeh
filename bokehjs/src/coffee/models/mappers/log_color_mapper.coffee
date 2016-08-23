_ = require "underscore"

ColorMapper = require "./color_mapper"


class LogColorMapper extends ColorMapper.Model
  type: "LogColorMapper"

  _get_values: (data, palette) ->
     n = palette.length
     low = @get('low') ? _.min(data)
     high = @get('high') ? _.max(data)
     scale = n / (Math.log1p(high) - Math.log1p(low))  # subtract the low offset
     values = []

     for i in [0...data.length]
       d = data[i]
       if _.isNaN(d)
         values[i] = @nan_color
         continue
       else if (d > high)
         d = high
       else if (d < low)
         d = low
       log = Math.log1p(d) - Math.log1p(low)  # subtract the low offset
       values[i] = palette[Math.floor(log * scale)]
     return values

module.exports =
  Model: LogColorMapper
