import * as _ from "underscore"

import * as Model from "../../model"
import * as hittest from "../../core/hittest"
import * as p from "../../core/properties"

class DataSource extends Model
  type: 'DataSource'

  @define {
      selected: [ p.Any, hittest.create_hit_test_result() ] # TODO (bev)
      callback: [ p.Any                                   ] # TODO: p.Either(p.Instance(Callback), p.Function) ]
    }

  initialize: (options) ->
    super(options)
    @listenTo @, 'change:selected', () =>
      callback = @callback
      if callback?
        if _.isFunction(callback)
          callback(@)
        else
          callback.execute(@)

export {
  DataSource as Model
}
