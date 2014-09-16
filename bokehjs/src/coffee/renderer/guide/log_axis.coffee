
define [
  "underscore",
  "common/collection",
  "./axis"
  "ticking/log_ticker",
  "ticking/log_tick_formatter",
], (_, Collection, Axis, LogTicker, LogTickFormatter) ->

  class LogAxisView extends Axis.View

  class LogAxis extends Axis.Model
    default_view: LogAxisView
    type: 'LogAxis'

    initialize: (attrs, objects) ->
      super(attrs, objects)
      if not @get('ticker')?
        @set_obj('ticker', LogTicker.Collection.create())
      if not @get('formatter')?
        @set_obj('formatter', LogTickFormatter.Collection.create())

  class LogAxes extends Collection
     model: LogAxis

  return {
    "Model": LogAxis,
    "Collection": new LogAxes(),
    "View": LogAxisView
  }
