_ = require "underscore"
Collections = require("../../common/base").Collections
LogTicker = require "../../ticking/log_ticker"
LogTickFormatter = require "../../ticking/log_tick_formatter"
Axis = require "./axis"

class LogAxisView extends Axis.View

class LogAxis extends Axis.Model
  default_view: LogAxisView
  type: 'LogAxis'

  initialize: (attrs, objects) ->
    super(attrs, objects)
    if not @get('ticker')?
      @set_obj('ticker', Collections('LogTicker').create())
    if not @get('formatter')?
      @set_obj('formatter', Collections('LogTickFormatter').create())

module.exports =
  Model: LogAxis
  View: LogAxisView
