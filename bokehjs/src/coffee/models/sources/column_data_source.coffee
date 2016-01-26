_ = require "underscore"
DataSource = require './data_source'
{logger} = require "../../common/logging"
SelectionManager = require "../../common/selection_manager"
hittest = require "../../common/hittest"

# Datasource where the data is defined column-wise, i.e. each key in the
# the data attribute is a column name, and its value is an array of scalars.
# Each column should be the same length.
class ColumnDataSource extends DataSource.Model
  type: 'ColumnDataSource'

  nonserializable_attribute_names: () ->
    super().concat(['selection_manager', 'inspected'])

  get_column: (colname) ->
    return @get('data')[colname] ? null

  get_length: () ->
    data = @get('data')
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

  columns: () ->
    # return the column names in this data source
    return _.keys(@get('data'))

  stream: (new_data, rollover) ->
    data = @get('data')
    for k, v of new_data
      data[k] = data[k].concat(new_data[k])
      if data[k].length > rollover
        data[k] = data[k].slice(-rollover)
    @set('data', data, {silent: true})
    @trigger('stream')

  defaults: =>
    return _.extend {}, super(), {
      data: {}
      selection_manager: new SelectionManager({'source':@})
      column_names: []
    }

module.exports =
  Model: ColumnDataSource
