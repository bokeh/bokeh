_ = require "underscore"
DataSource = require "./data_source"

class RemoteDataSource extends DataSource.Model
  type: 'RemoteDataSource'

  defaults: =>
    return _.extend {}, super(), {
      data: {}
      data_url: null
      polling_interval: null
    }

module.exports =
  Model: RemoteDataSource
