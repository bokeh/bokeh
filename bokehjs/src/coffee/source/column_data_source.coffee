
define [
  "underscore",
  "common/collection",
  "common/has_properties",
  "common/selection_manager",
], (_, Collection, HasProperties, SelectionManager) ->

  # Datasource where the data is defined column-wise, i.e. each key in the
  # the data attribute is a column name, and its value is an array of scalars.
  # Each column should be the same length.
  class ColumnDataSource extends HasProperties
    type: 'ColumnDataSource'

    get_column: (colname) ->
      return @get('data')[colname] ? null

    get_length: () ->
      data = @get('data')
      if _.keys(data).length == 0
        return null # XXX: don't guess, treat on case-by-case basis
      else
        lengths = _.uniq(val.length for key, val of data)
        return lengths[0]

        # TODO: this causes **a lot** of errors currently
        #
        # if lengths.length == 1
        #     return lengths[0]
        # else
        #     throw new Error("data source has columns of inconsitent lengths")

    columns: () ->
      # return the column names in this data source
      return _.keys(@get('data'))

    datapoints: () ->
      # return the data in this data source as a "array of records"
      data = @get('data')
      fields = _.keys(data)
      if fields.length == 0
        return []
      points = []
      for i in [0...data[fields[0]].length]
        point = {}
        for field in fields
          point[field] = data[field][i]
        points.push(point)
      return points

    defaults: =>
      return _.extend {}, super(), {
        data: {}
        selection_manager: new SelectionManager({'source':@})
      }

  class ColumnDataSources extends Collection
    model: ColumnDataSource

  return {
    "Model": ColumnDataSource,
    "Collection": new ColumnDataSources()
  }

