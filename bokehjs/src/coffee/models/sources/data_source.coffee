import {Model} from "../../model"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {isFunction} from "core/util/types"

export class DataSource extends Model
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
        if isFunction(callback)
          callback(@)
        else
          callback.execute(@)
