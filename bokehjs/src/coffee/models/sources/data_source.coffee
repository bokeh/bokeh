_ = require "underscore"

Model = require "../../model"
hittest = require "../../common/hittest"
p = require "../../core/properties"

class DataSource extends Model
  type: 'DataSource'

  @define {
      selected: [ p.Any, hittest.create_hit_test_result() ] # TODO (bev)
      callback: [ p.Any                                   ] # TODO: p.Either(p.Instance(Callback), p.Function) ]
    }

  initialize: (options) ->
    super(options)
    @listenTo @, 'change:selected', () =>
      callback = @get('callback')
      if callback?
        if _.isFunction(callback)
          callback(@)
        else
          callback.execute(@)

module.exports =
  Model: DataSource
