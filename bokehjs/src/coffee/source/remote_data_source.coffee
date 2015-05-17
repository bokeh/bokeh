_ = require "underscore"
Backbone = require "backbone"
ColumnDataSource = require "./column_data_source"

class RemoteDataSource extends ColumnDataSource.Model

module.exports =
  RemoteDataSource: RemoteDataSource
