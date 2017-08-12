import {Model} from "../../model"

export class Expression extends Model

  initialize: (attrs, options) ->
    super(attrs, options)
    @_connected= {}
    @_result = {}

  _v_compute: (source) ->
    if not @_connected[source.id]?
      @connect(source.change, () -> @_result[source.id] = null)
      @_connected[source.id] = true

    if @_result[source.id]?
      return @_result[source.id]

    @_result[source.id] = @v_compute(source)
    return @_result[source.id]
