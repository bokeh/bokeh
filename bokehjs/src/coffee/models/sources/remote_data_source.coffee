_ = require "underscore"

ColumnDataSource = require "./column_data_source"
p = require "../../core/properties"

class RemoteDataSource extends ColumnDataSource.Model
  type: 'RemoteDataSource'

  @define {
      data_url:         [ p.String    ]
      polling_interval: [ p.Number    ]
    }

module.exports =
  Model: RemoteDataSource
