_ = require "underscore"
Model = require "../model"
hittest = require "../common/hittest"

class DataSource extends Model
  type: 'DataSource'

  defaults: =>
    return _.extend {}, super(), {
      selected: hittest.create_hit_test_result()
      callback: null
    }

  initialize: (options) ->
    super(options)
    @listenTo(@, 'change:selected', () =>
      @get('callback')?.execute(@)
    )

module.exports =
  Model: DataSource
