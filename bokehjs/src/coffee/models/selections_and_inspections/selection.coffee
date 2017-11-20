import {Model} from "../../model"
import * as p from "core/properties"
import {union} from "core/util/array"
import {merge} from "core/util/object"

export class Selection extends Model
  type: "Selection"

  initialize: (options) ->
    super(options)

    @['0d'] = {'glyph': null, 'indices': []}
    @['2d'] = {'indices': {}}
    @['1d'] = {'indices': @indices}

  @define {
    indices:      [p.Array,   [] ]
  }

  is_empty: () ->
    @indices.length == 0

  update_through_union: (other) ->
    @indices = union(other.indices, @indices)
