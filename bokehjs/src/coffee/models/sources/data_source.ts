import {Model} from "../../model"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {isFunction} from "core/util/types"

export class DataSource extends Model {

  selected: hittest.HitTestResult
  callback: any // XXX

  static initClass() {
    this.prototype.type = "DataSource"

    this.define({
      selected: [ p.Any, () => hittest.create_hit_test_result() ], // TODO (bev)
      callback: [ p.Any                                         ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
    })
  }

  initialize(options: any): void {
    super.initialize(options)
    this.connect(this.properties.selected.change, () => {
      const {callback} = this
      if (callback != null) {
        if (isFunction(callback))
          callback(this)
        else
          callback.execute(this)
      }
    })
  }
}
DataSource.initClass()
