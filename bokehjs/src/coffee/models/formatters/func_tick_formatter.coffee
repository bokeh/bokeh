_ = require "underscore"

p = require "../../core/properties"

TickFormatter = require "../formatters/tick_formatter"

class FuncTickFormatter extends TickFormatter.Model
  type: 'FuncTickFormatter'

  @define {
      code: [ p.String,  ''           ]
      lang: [ p.String , 'javascript' ] # TODO (bev) enum
    }

  doFormat: (ticks) ->
    code = @get("code")

    code = switch @get("lang")
      when "javascript"
        code
      when "coffeescript"
        coffee = require "coffee-script"
        coffee.compile(code, {bare: true, shiftLine: true})

    # wrap the `code` fxn inside a function and make it a callable
    # func = new Function("tick", "var a = " + code + "return a(tick)")
    func = new Function("tick", "var func = " + code + "return func(tick)")

    return _.map(ticks, func)

module.exports =
  Model: FuncTickFormatter
