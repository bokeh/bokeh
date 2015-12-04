_ = require "underscore"
Backbone = require "backbone"
ColumnDataSource = require "./column_data_source"

class RemoteDataSource extends ColumnDataSource.Model
  defaults: ->
    return _.extend {}, super(), {
      data_url: null
      polling_interval: null
    }

module.exports =
  RemoteDataSource: RemoteDataSource
