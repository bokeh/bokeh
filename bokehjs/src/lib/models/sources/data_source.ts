import {Model} from "../../model"
import * as p from "core/properties"
import {isFunction} from "core/util/types"
import {Selection} from "../selections/selection"

export namespace DataSource {
  export interface Attrs extends Model.Attrs {
    selected: Selection
    callback: any // XXX
  }

  export interface Props extends Model.Props {
    selected: p.Property<Selection>
    callback: p.Property<any> // XXX
  }
}

export interface DataSource extends DataSource.Attrs {}

export abstract class DataSource extends Model {

  properties: DataSource.Props

  constructor(attrs?: Partial<DataSource.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "DataSource"

    this.define({
      selected: [ p.Instance, () => new Selection() ], // TODO (bev)
      callback: [ p.Any                             ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
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

  setup?(): void
}
DataSource.initClass()
