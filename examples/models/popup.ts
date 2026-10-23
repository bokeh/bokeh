import {Model} from "model"
import type {DataSource} from "models/sources/data_source"
import {IndexedDataSource} from "models/sources/indexed_data_source"
import type {TapToolCallback} from "models/tools/gestures/tap_tool"
import {TapTool} from "models/tools/gestures/tap_tool"
import type {ExecutableOf} from "core/util/callbacks"
import {replace_placeholders} from "core/util/templating"
import type * as p from "core/properties"
import {popup} from "./popup_helper"

export namespace Popup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    message: p.Property<string>
  }
}

export interface Popup extends Popup.Attrs {}

export class Popup extends Model implements ExecutableOf<TapToolCallback> {
  declare properties: Popup.Props

  constructor(attrs?: Partial<Popup.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Popup.Props>(({Str}) => ({
      message: [ Str, "" ]
    }))
  }

  execute(_: TapTool, {source}: {source: DataSource}): void {
    if (!(source instanceof IndexedDataSource))
      return

    for (const i of source.selected.indices) {
      const message = replace_placeholders(this.message, source, i)
      popup(message.toString())
    }
  }
}
