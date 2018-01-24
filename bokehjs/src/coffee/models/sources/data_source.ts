import {Model} from "../../model"
import * as p from "core/properties"
import {isFunction} from "core/util/types"
import {Selection} from "../selections/selection"

export class DataSource extends Model {

  selected: Selection
  callback: any // XXX

  static initClass() {
    this.prototype.type = "DataSource"

    this.define({
      selected: [ p.Instance                        ], // TODO (bev)
      callback: [ p.Any                             ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
    })
  }

  initialize(): void {
    super.initialize()

    if (!this.selected) {
      this.selected = new Selection()
    }
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
