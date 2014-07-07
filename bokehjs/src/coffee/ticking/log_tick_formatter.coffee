
define [
  "underscore",
  "backbone",
  "common/has_properties",
  "ticking/basic_tick_formatter"
], (_, Backbone, HasProperties, BasicTickFormatter) ->

  class LogTickFormatter extends HasProperties
    type: 'LogTickFormatter'

    dinitialize: (attrs, options) ->
      super(attrs, options)
      @basic_formatter = new BasicTickFormatter.Model()

    format: (ticks) ->
      if ticks.length == 0
        return []

      small_interval = false
      labels = new Array(ticks.length)
      for i in [0...ticks.length]
        labels[i] = "10^#{ Math.round(Math.log(ticks[i]) / Math.log(10)) }"
        if (i > 0) and (labels[i] == labels[i-1])
          small_interval = true
          break

      if small_interval
        labels = @basic_formatter.format(ticks)

      return labels

  class LogTickFormatters extends Backbone.Collection
    model: LogTickFormatter

  return {
    "Model": LogTickFormatter,
    "Collection": new LogTickFormatters()
  }
