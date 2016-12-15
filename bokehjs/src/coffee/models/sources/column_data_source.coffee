import * as _ from "underscore"

import {DataSource} from "./data_source"
import * as hittest from "../../core/hittest"
import {SelectionManager} from "../../core/selection_manager"
import {logger} from "../../core/logging"
import * as p from "../../core/properties"
import * as serialization from "../../core/util/serialization"

# Datasource where the data is defined column-wise, i.e. each key in the
# the data attribute is a column name, and its value is an array of scalars.
# Each column should be the same length.
export class ColumnDataSource extends DataSource
  type: 'ColumnDataSource'

  initialize: (options) ->
    super(options)
    [@data, @_shapes] = serialization.decode_column_data(@data)

  @define {
      data:         [ p.Any,   {} ]
      column_names: [ p.Array, [] ]
    }

  @internal {
    selection_manager: [ p.Instance, (self) -> new SelectionManager({source: self}) ]
    inspected:         [ p.Any ]
    _shapes:           [ p.Any, {}]
  }

  get_column: (colname) ->
    return @data[colname] ? null

  get_length: () ->
    data = @data
    if _.keys(data).length == 0
      return null # XXX: don't guess, treat on case-by-case basis
    else
      lengths = _.uniq((val.length for key, val of data))

      if lengths.length > 1
        logger.debug("data source has columns of inconsistent lengths")

      return lengths[0]

      # TODO: this causes **a lot** of errors currently
      #
      # if lengths.length == 1
      #     return lengths[0]
      # else
      #     throw new Error("data source has columns of inconsistent lengths")

  attributes_as_json: (include_defaults=true, value_to_json=ColumnDataSource._value_to_json) ->
    attrs = {}
    for own key, value of @serializable_attributes()
      if key == 'data'
        value = serialization.encode_column_data(value, @_shapes)
      if include_defaults
        attrs[key] = value
      else if key of @_set_after_defaults
        attrs[key] = value
    value_to_json("attributes", attrs, @)

  columns: () ->
    # return the column names in this data source
    return _.keys(@data)

  stream: (new_data, rollover) ->
    data = @data
    for k, v of new_data
      data[k] = data[k].concat(new_data[k])
      if data[k].length > rollover
        data[k] = data[k].slice(-rollover)
    @setv('data', data, {silent: true})
    @trigger('stream')

  patch: (patches) ->
    data = @data
    for k, patch of patches
      for i in [0...patch.length]
        [ind, value] = patch[i]
        data[k][ind] = value
    @setv('data', data, {silent: true})
    @trigger('patch')
