_ = require "underscore"

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

    @define_computed_property('values', @_make_values, true)
    @add_dependencies('values', @, ['args'])

    @define_computed_property('func', @_make_func, true)
    @add_dependencies('func', @, ['args', 'code'])

  _make_values: () ->
    return _.values(@get("args"))

  _make_func: () ->
    return new Function("tick", _.keys(@get("args"))..., "require", @code)

  doFormat: (ticks) ->
    return (@get('func')(tick, @get('values')..., require) for tick in ticks)

module.exports =
  Model: FuncTickFormatter
