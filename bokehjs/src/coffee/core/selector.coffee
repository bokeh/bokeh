import {HasProps} from "./has_props"
import * as hittest from "./hittest"
import * as p from "./properties"

export class Selector extends HasProps
  type: 'Selector'

  update: (indices, final, append, silent=false) ->
    @setv('timestamp', new Date(), {silent: silent})
    @setv('final', final, {silent: silent})
    if append
      indices.update_through_union(@indices)
    @setv('indices', indices, {silent: silent})

  clear: () ->
    @timestamp = new Date()
    @final = true
    @indices = hittest.create_hit_test_result()

  @internal {
    indices:   [ p.Any, () -> hittest.create_hit_test_result() ]
    final:     [ p.Boolean ]
    timestamp: [ p.Any ]
  }
