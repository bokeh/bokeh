import {Model} from "../../model"
import * as p from "core/properties"
import {isFunction} from "core/util/types"

export class Range extends Model
  type: 'Range'

  `
  start: number
  end: number
  min: number
  max: number
  `

  initialize: (options) ->
    super(options)
    @connect(@change, () -> @_emit_callback())

  @define {
    callback: [ p.Any ] # TODO: p.Either(p.Instance(Callback), p.Function)
  }

  @internal {
    plots: [ p.Array, [] ]
  }

  reset: () ->
    """
    This method should be reimplemented by subclasses and ensure that
    the callback, if exists, is executed at completion.
    """
    @change.emit()

  _emit_callback: () ->
    if @callback?
      if isFunction(@callback)
        @callback(@)
      else
        @callback.execute(@)
