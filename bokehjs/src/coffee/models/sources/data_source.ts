import {Model} from "../../model"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {isFunction} from "core/util/types"

export namespace DataSource {
  export interface Attrs extends Model.Attrs {
    selected: hittest.HitTestResult
    callback: any // XXX
  }

  export interface Opts extends Model.Opts {}
}

export interface DataSource extends DataSource.Attrs {}

export abstract class DataSource extends Model {

  static initClass() {
    this.prototype.type = "DataSource"

    this.define({
      selected: [ p.Any, () => hittest.create_hit_test_result() ], // TODO (bev)
      callback: [ p.Any                                         ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
    })
  }

  connect_signals(): void {
    super.connect_signals()
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
