
define [
  "backbone"
  "underscore"
  "./column_data_source"
], (Backbone, _, ColumnDataSource) ->

  class RemoteDataSource extends ColumnDataSource.Model

  return {'RemoteDataSource' : RemoteDataSource}
