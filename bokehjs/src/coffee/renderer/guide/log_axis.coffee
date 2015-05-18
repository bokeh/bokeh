Axis = require "./axis"

class LogAxisView extends Axis.View

class LogAxis extends Axis.Model
  default_view: LogAxisView
  type: 'LogAxis'

  initialize: (attrs, objects) ->
    super(attrs, objects)
    Collections = require("../../common/base").Collections
    if not @get('ticker')?
      @set_obj('ticker', Collections('LogTicker').create())
    if not @get('formatter')?
      @set_obj('formatter', Collections('LogTickFormatter').create())

module.exports =
  Model: LogAxis
  View: LogAxisView
