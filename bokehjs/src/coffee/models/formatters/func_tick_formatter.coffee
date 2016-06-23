_ = require "underscore"

p = require "../../core/properties"

TickFormatter = require "../formatters/tick_formatter"

class FuncTickFormatter extends TickFormatter.Model
  type: 'FuncTickFormatter'

  @define {
      args: [ p.Any,     {}           ] # TODO (bev) better type
      code: [ p.String,  ''           ]
      lang: [ p.String , 'javascript' ] # TODO (bev) enum
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
    code = @get("code")

    code = switch @get("lang")
      when "javascript"
        code
      when "coffeescript"
        coffee = require "coffee-script"
        coffee.compile(code, {bare: true, shiftLine: true})

    # wrap the `code` fxn inside a function and make it a callable
    # add the `args` to the parent closure so that they're available in namespace
    return new Function("tick", _.keys(@get("args"))..., "var func = " + code + "return func(tick)")

  doFormat: (ticks) ->
    return (@get('func')(tick, @get('values')...) for tick in ticks)

module.exports =
  Model: FuncTickFormatter
