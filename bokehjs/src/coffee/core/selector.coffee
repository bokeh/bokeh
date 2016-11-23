import * as _ from "underscore"
import {HasProps} from "./has_props"
import * as hittest from "./hittest"
import {logger} from "./logging"
import * as p from "./properties"

export class Selector extends HasProps
  type: 'Selector'

  update: (indices, final, append, silent=false) ->
    @setv('timestamp', new Date(), {silent: silent})
    @setv('final', final, {silent: silent})
    if append
      _xor = (arr_1, arr_2) -> _.difference(_.union(arr_1, arr_2), _.intersection(arr_1, arr_2))

      indices['0d'].indices =  _xor(@indices['0d'].indices, indices['0d'].indices)
      indices['0d'].glyph =  @indices['0d'].glyph or indices['0d'].glyph
      indices['1d'].indices =  _xor(@indices['1d'].indices, indices['1d'].indices)
      indices['2d'].indices =  _xor(@indices['2d'].indices, indices['2d'].indices)
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
