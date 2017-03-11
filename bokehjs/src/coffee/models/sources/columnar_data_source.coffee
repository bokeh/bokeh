import {DataSource} from "./data_source"
import {logger} from "core/logging"
import {SelectionManager} from "core/selection_manager"
import * as p from "core/properties"
import {uniq} from "core/util/array"

# Abstract baseclass for column based data sources, where the column
# based data may be supplied directly or be computed from an attribute
export class ColumnarDataSource extends DataSource
  type: 'ColumnarDataSource'

  @define {
    column_names: [ p.Array, [] ]
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
        msg = "data source has columns of inconsistent lengths"
        if soft
          logger.warn(msg)
          return lengths.sort()[0]
        else
          throw new Error(msg)
