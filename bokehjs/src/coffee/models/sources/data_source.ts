import {Model} from "../../model"
import * as hittest from "core/hittest"
import * as p from "core/properties"
import {isFunction} from "core/util/types"
import {Selection} from "../selections/selection"

export class DataSource extends Model {

  selected: hittest.HitTestResult
  callback: any // XXX

  static initClass() {
    this.prototype.type = "DataSource"

    this.define({
      selected: [ p.Instance, () => new Selection() ], // TODO (bev)
      callback: [ p.Any                             ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
    })
  }

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options)

    if (!this.selected) {
      this.selected = new Selection()
    }
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
