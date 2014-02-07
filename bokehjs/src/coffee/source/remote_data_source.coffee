
define [
  "underscore",
  "backbone",
  "./object_array_data_source"
], (_, Backbone, ObjectArrayDataSource) ->

  class RemoteDataSource extends ObjectArrayDataSource.Model
    # Datasource where the data is defined column-wise, i.e. each key in the
    # the data attribute is a column name, and its value is an array of scalars.
    # Each column should be the same length.
    type: 'RemoteDataSource'
    initialize: (attrs, options) ->
      super(attrs, options)
      @cont_ranges = {}
      @discrete_ranges = {}
      data_source = @
      api_endpoint = @get('api_endpoint')
      $.getJSON(@get('api_endpoint')+'columns',
        {},
        (json) =>
          @set('columns', json.columns)
          console.log("columns", json.columns))
      $.getJSON(@get('api_endpoint')+'index',
        {},
        (json) =>
          data = data_source.get('data')
          data['index'] = json.index)


    getcolumn: (colname) ->
      return @get('data')[colname]

    getcolumn_with_default: (colname, default_value) ->
      """ returns the column, with any undefineds replaced with default""" #"
      return @get('data')[colname]

    get_length :  ->
      data = @get('data')
      return data[_.keys(data)[0]].length

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

    remote_add_column: (column_name, callback) ->
      
      data_source = @
      data = data_source.get('data')
      if _.has(data, column_name)
        callback(column_name)
      else 
        $.getJSON(  
          @get('api_endpoint')+'values/' + column_name,
          {},
          (json) ->
            data = data_source.get('data')
            data[column_name] = json[column_name]
            callback(column_name)
            )
  
    defaults: () ->
      return {
        data: [{}]
        name: 'data'
        selected: []
        api_endpoint: ""
        selecting: false
      }
      

  class RemoteDataSources extends Backbone.Collection
    model: RemoteDataSource

  return {
    "Model": RemoteDataSource,
    "Collection": new RemoteDataSources()
  }



