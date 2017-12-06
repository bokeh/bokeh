import {Model} from "../../model"
import * as p from "core/properties"
import {union, intersection} from "core/util/array"
import {merge} from "core/util/object"

export class Selection extends Model
  type: "Selection"

  initialize: (options) ->
    super(options)

    @['0d'] = {'glyph': null, 'indices': []}
    @['2d'] = {'indices': {}}
    @['1d'] = {'indices': @indices}

    @connect @properties.indices.change, () ->
      @['1d']['indices'] = @indices

  @define {
    indices:      [p.Array,   [] ]
  }

  @internal {
    final:        [p.Boolean     ]
  }

  update: (selection, final, append) ->
    @final = final
    if append
      @update_through_union(selection)
    else
      @indices = selection.indices

  clear: () ->
    @final = true
    @indices = []

  is_empty: () ->
    @indices.length == 0

  update_through_union: (other) ->
    @indices = union(other.indices, @indices)

  update_through_intersection: (other) ->
    @indices = intersection(other.indices, @indices)
