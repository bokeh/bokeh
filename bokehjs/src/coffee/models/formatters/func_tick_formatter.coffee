import * as _ from "underscore"

import * as p from "../../core/properties"

import {TickFormatter} from "../formatters/tick_formatter"

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

  doFormat: (ticks) ->
    func = @_make_func()
    return (func(tick, _.values(@args)..., require) for tick in ticks)
