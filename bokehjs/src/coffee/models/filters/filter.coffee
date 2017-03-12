import {Model} from "../../model"
import * as p from "core/properties"

export class Filter extends Model
  type: 'Filter'

  initialize: (options) ->
    super(options)

    @compute_indices()

    @listenTo @, 'change:filter', @compute_indices

  @define {
    filter:      [p.Any       ]
  }

  @internal {
    indices:     [p.Array, [] ]
  }

  compute_indices: () ->
    @indices = @filter

  get_indices: () ->
    return @indices
