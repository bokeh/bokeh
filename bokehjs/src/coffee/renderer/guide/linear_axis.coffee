Axis = require "./axis"

class LinearAxisView extends Axis.View

class LinearAxis extends Axis.Model
  default_view: LinearAxisView
  type: 'LinearAxis'

  initialize: (attrs, objects) ->
    super(attrs, objects)
    Collections = require("../../common/base").Collections
    if not @get('ticker')?
      @set_obj('ticker', Collections('BasicTicker').create())
    if not @get('formatter')?
      @set_obj('formatter', Collections('BasicTickFormatter').create())

module.exports =
  Model: LinearAxis
  View: LinearAxisView
