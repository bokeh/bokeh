_ = require "underscore"
Collection = require "../../common/collection"
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
      @set_obj('ticker', BasicTicker.Collection.create())
    if not @get('formatter')?
      @set_obj('formatter', BasicTickFormatter.Collection.create())

class LinearAxes extends Collection
  model: LinearAxis

module.exports =
  Model: LinearAxis
  Collection: new LinearAxes()
  View: LinearAxisView
