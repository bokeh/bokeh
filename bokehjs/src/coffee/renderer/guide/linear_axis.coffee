_ = require "underscore"
Collections = require("../../common/base").Collections
BasicTicker = require "../../ticking/basic_ticker"
BasicTickFormatter = require "../../ticking/basic_tick_formatter"
Axis = require "./axis"

class LinearAxisView extends Axis.View

class LinearAxis extends Axis.Model
  default_view: LinearAxisView
  type: 'LinearAxis'

  initialize: (attrs, objects) ->
    super(attrs, objects)
    if not @get('ticker')?
      @set_obj('ticker', Collection('BasicTicker').create())
    if not @get('formatter')?
      @set_obj('formatter', Collection('BasicTickFormatter').create())

module.exports =
  Model: LinearAxis
  View: LinearAxisView
