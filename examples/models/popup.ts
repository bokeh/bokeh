import {Model} from "model"
import {ColumnarDataSource} from "models/sources/columnar_data_source"
import {TapTool, TapToolCallback} from "models/tools/gestures/tap_tool"
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

export class Popup extends Model implements TapToolCallback {
  declare properties: Popup.Props

  constructor(attrs?: Partial<Popup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Popup.Props>(({String}) => ({
      message: [ String, "" ]
    }))
  }

  execute(_: TapTool, {source}: {source: ColumnarDataSource}): void {
    for (const i of source.selected.indices) {
      const message = replace_placeholders(this.message, source, i)
      popup(message.toString())
    }
  }
}
