import {PickerBase, PickerBaseView} from "./picker_base"
import * as p from "core/properties"

export class TimePickerView extends PickerBaseView {
  declare model: TimePicker

  override connect_signals(): void {
    super.connect_signals()
  }
}

export namespace TimePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PickerBase.Props & {
  }
}

export interface TimePicker extends TimePicker.Attrs {}

export class TimePicker extends PickerBase {
  declare properties: TimePicker.Props
  declare __view_type__: TimePickerView

  constructor(attrs?: Partial<TimePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TimePickerView

    this.define<TimePicker.Props>(() => ({
    }))
  }
}
