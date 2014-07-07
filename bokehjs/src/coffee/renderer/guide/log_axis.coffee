
define [
  "underscore",
  "backbone",
  "./axis"
  "ticking/log_ticker",
  "ticking/log_tick_formatter",
], (_, Backbone, Axis, LogTicker, LogTickFormatter) ->

  class LogAxisView extends Axis.View

  class LogAxis extends Axis.Model
    default_view: LogAxisView
    type: 'LogAxis'

    dinitialize: (attrs, objects) ->
      super(attrs, objects)
      if not @get_obj('ticker')?
        @set_obj('ticker', LogTicker.Collection.create())
      if not @get_obj('formatter')?
        @set_obj('formatter', LogTickFormatter.Collection.create())

  class LogAxes extends Backbone.Collection
     model: LogAxis

  return {
    "Model": LogAxis,
    "Collection": new LogAxes(),
    "View": LogAxisView
  }