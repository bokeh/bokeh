_ = require "underscore"

Model = require "../../model"
hittest = require "../../common/hittest"
p = require "../../core/properties"

class DataSource extends Model
  type: 'DataSource'

  @define {
      selected: [ p.Any, hittest.create_hit_test_result() ] # TODO (bev)
      callback: [ p.Instance ]
    }

  initialize: (options) ->
    super(options)
    @listenTo(@, 'change:selected', () =>
      @get('callback')?.execute(@)
    )

module.exports =
  Model: DataSource
