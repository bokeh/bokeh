import {Model} from "../../model"
import {Selection} from "../selections/selection"
import {CallbackLike} from "../callbacks/callback"
import * as p from "core/properties"

export namespace DataSource {
  export interface Attrs extends Model.Attrs {
    selected: Selection
    callback: CallbackLike<DataSource> | null
  }

  export interface Props extends Model.Props {
    selected: p.Property<Selection>
    callback: p.Property<CallbackLike<DataSource> | null>
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
      if (this.callback != null)
        this.callback.execute(this)
    })
  }

  setup?(): void
}
DataSource.initClass()
