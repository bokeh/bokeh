import {Model} from "../../model"
import * as p from "../../core/properties"
import * as serialization from "../../core/util/serialization"
import * as hittest from "../../core/hittest"
import {SelectionManager} from "../../core/selection_manager"
import {uniq} from "../../core/util/array"

export class ColumnDataStore extends Model
  type: 'ColumnDataStore'

  initialize: (options) ->
    super(options)
    [@data, @_shapes] = serialization.decode_column_data(@data)

  @define {
      data: [p.Any]
      column_names: [p.Array]
      selected: [ p.Any, hittest.create_hit_test_result() ] # TODO (bev)
    }

  @internal {
    selection_manager: [ p.Instance, (self) -> new SelectionManager({source: self}) ]
    inspected:         [ p.Any ]
    _shapes:      [ p.Any, {}]
  }

  get_column: (colname) ->
    return @data[colname] ? null

  columns: () ->
    # return the column names in this data source
    return Object.keys(@data)

  get_length: (soft=true) ->
    lengths = uniq((val.length for _key, val of @data))

    switch lengths.length
      when 0
        return null # XXX: don't guess, treat on case-by-case basis
      when 1
        return lengths[0]
      else
        msg = "data store has columns of inconsistent lengths"
        if soft
          logger.warn(msg)
          return lengths.sort()[0]
        else
          throw new Error(msg)
