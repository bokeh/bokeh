import {Filter} from "./filter"
import * as p from "core/properties"
import {values} from "core/util/object"

export class CustomJSFilter extends Filter
  type: 'CustomJSFilter'

  @define {
      args: [ p.Any,    {} ] # TODO (bev) better type
      code: [ p.String, '' ]
  }

  @getters {
    values: () -> @_make_values()
    func:   () -> @_make_func()
  }

  compute_indices: (source) ->
    @filter = @func(@values..., source, require, {})
    super()

  _make_values: () -> values(@args)

  _make_func: () ->
    # this relies on Object.keys(args) and values(args) returning keys and values
    # in the same order
    new Function(Object.keys(@args)..., "source", "require", "exports", @code)
