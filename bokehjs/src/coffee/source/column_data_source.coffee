_ = require "underscore"
HasProperties = require "../common/has_properties"
SelectionManager = require "../common/selection_manager"
hittest = require "../common/hittest"

# Datasource where the data is defined column-wise, i.e. each key in the
# the data attribute is a column name, and its value is an array of scalars.
# Each column should be the same length.
class ColumnDataSource extends HasProperties
  type: 'ColumnDataSource'

  initialize: (options) ->
    super(options)
    @listenTo(@, 'change:selected', () =>
      @get('callback')?.execute(@)
    )

  get_column: (colname) ->
    return @get('data')[colname] ? null

  get_length: () ->
    data = @get('data')
    if _.keys(data).length == 0
      return null # XXX: don't guess, treat on case-by-case basis
    else
      lengths = _.uniq((val.length for key, val of data))
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

  defaults: =>
    return _.extend {}, super(), {
      data: {}
      selection_manager: new SelectionManager({'source':@})
      selected: hittest.create_hit_test_result()
    }

module.exports =
  Model: ColumnDataSource