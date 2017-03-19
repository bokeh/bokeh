import {TickFormatter} from "./tick_formatter"
import * as p from "core/properties"
import {values} from "core/util/object"

export class FuncTickFormatter extends TickFormatter
  type: 'FuncTickFormatter'

  @define {
    args: [ p.Any,     {}           ] # TODO (bev) better type
    code: [ p.String,  ''           ]
  }

  initialize: (attrs, options) ->
    super(attrs, options)

  _make_func: () ->
    return new Function("tick", Object.keys(@args)..., "require", @code)

  doFormat: (ticks, loc) ->
    func = @_make_func()
    return (func(tick, values(@args)..., require) for tick in ticks)
