import {HasProps} from "./has_props"
import * as hittest from "./hittest"
import {logger} from "./logging"
import * as p from "./properties"
import {union, concat} from "./util/array"

merge = (obj1, obj2) ->
  result = {}

  keys = concat(Object.keys(obj1),
                Object.keys(obj2))

  for key in keys
    arr1 = obj1[key] or []
    arr2 = obj2[key] or []
    result[key] = union(arr1, arr2)

  return result

export class Selector extends HasProps
  type: 'Selector'

  update: (indices, final, append, silent=false) ->
    @setv('timestamp', new Date(), {silent: silent})
    @setv('final', final, {silent: silent})
    if append
      indices['0d'].indices = union(@indices['0d'].indices, indices['0d'].indices)
      indices['0d'].glyph =  @indices['0d'].glyph or indices['0d'].glyph
      indices['1d'].indices = union(@indices['1d'].indices, indices['1d'].indices)
      indices['2d'].indices = merge(@indices['2d'].indices, indices['2d'].indices)
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
