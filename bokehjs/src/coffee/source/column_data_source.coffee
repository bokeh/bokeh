
define [
  "underscore",
  "backbone",
  "common/has_properties",
], (_, Backbone, HasProperties) ->

  class ColumnDataSource extends HasProperties
    # Datasource where the data is defined column-wise, i.e. each key in the
    # the data attribute is a column name, and its value is an array of scalars.
    # Each column should be the same length.
    type: 'ColumnDataSource'
    initialize: (attrs, options) ->
      super(attrs, options)
      @cont_ranges = {}
      @discrete_ranges = {}

    getcolumn: (colname) ->
      return @get('data')[colname] ? null

    getcolumn_with_default: (colname, default_value) ->
      """ returns the column, with any undefineds replaced with default""" #"
      return @get('data')[colname] ? null

    get_length: () ->
      data = @get('data')
      return data[_.keys(data)[0]].length

    columns: () ->
      return _.keys(@get('data'))

    datapoints: () ->
      data = @get('data')
      fields = _.keys(data)
      points = []
      for i in [0...data[fields[0]].length]
        point = {}
        for field in fields
          point[field] = data[field][i]
        points.push(point)
      return points

    defaults: () ->
      super()

  class ColumnDataSources extends Backbone.Collection
    model: ColumnDataSource

  return {
    "Model": ColumnDataSource,
    "Collection": new ColumnDataSources()
  }

