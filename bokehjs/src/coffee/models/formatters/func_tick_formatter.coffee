import * as _ from "underscore"

p = require "../../core/properties"

TickFormatter = require "../formatters/tick_formatter"

class FuncTickFormatter extends TickFormatter.Model
  type: 'FuncTickFormatter'

  @define {
      args: [ p.Any,     {}           ] # TODO (bev) better type
      code: [ p.String,  ''           ]
    }

  initialize: (attrs, options) ->
    super(attrs, options)

  _make_func: () ->
    return new Function("tick", _.keys(@args)..., "require", @code)

  doFormat: (ticks) ->
    func = @_make_func()
    return (func(tick, _.values(@args)..., require) for tick in ticks)

module.exports =
  Model: FuncTickFormatter
