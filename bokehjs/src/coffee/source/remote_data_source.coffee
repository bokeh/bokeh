_ = require "underscore"
ColumnDataSource = require "./column_data_source"

class RemoteDataSource extends ColumnDataSource.Model
  type: 'RemoteDataSource'

  defaults: =>
    return _.extend {}, super(), {
      data: {}
      data_url: null
      polling_interval: null
    }

module.exports =
  Model: RemoteDataSource
