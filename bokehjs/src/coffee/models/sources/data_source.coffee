import {Model} from "../../model"
import * as p from "core/properties"
import {isFunction} from "core/util/types"
import {Selection} from "../selections_and_inspections/selection"

export class DataSource extends Model
  type: 'DataSource'

  @define {
      selected: [ p.Instance, () -> new Selection() ] # TODO (bev)
      callback: [ p.Any                             ] # TODO: p.Either(p.Instance(Callback), p.Function) ]
    }

  initialize: (options) ->
    super(options)

    if !@selected
      @selected = new Selection()

    @connect @properties.selected.change, () =>
      callback = @callback
      if callback?
        if isFunction(callback)
          callback(@)
        else
          callback.execute(@)
