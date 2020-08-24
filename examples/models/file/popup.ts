import {Model} from "model"
import {ColumnarDataSource} from "models/sources/columnar_data_source"
import {replace_placeholders} from "core/util/templating"
import * as p from "core/properties"
import {popup} from "./popup_helper"

export namespace Popup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    message: p.Property<string>
  }
}

export interface Popup extends Popup.Attrs {}

export class Popup extends Model {
  properties: Popup.Props

  constructor(attrs?: Partial<Popup.Attrs>) {
    super(attrs)
  }

  static init_Popup(): void {
    this.define<Popup.Props>({
      message: [ p.String, "" ]
    })
  }

  execute(data_source: ColumnarDataSource): void {
    for (const i of data_source.selected.indices) {
      const message = replace_placeholders(this.message, data_source, i)
      popup(message.toString())
    }
  }
}
