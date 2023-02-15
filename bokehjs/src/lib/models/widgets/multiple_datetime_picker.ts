import {DatePicker, DatePickerView} from "./date_picker"
import {DateLike} from "./base_date_picker"
import * as p from "core/properties"

export class MultipleDatetimePickerView extends DatePickerView {
  declare model: MultipleDatetimePicker
}

export namespace MultipleDatetimePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DatePicker.Props & {
  }
}

export interface MultipleDatetimePicker extends MultipleDatetimePicker.Attrs {}

export class MultipleDatetimePicker extends DatePicker {
  declare properties: MultipleDatetimePicker.Props
  declare __view_type__: MultipleDatetimePickerView

  declare value: DateLike | null

  constructor(attrs?: Partial<MultipleDatetimePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MultipleDatetimePickerView

    this.define<MultipleDatetimePicker.Props>(() => ({
    }))
  }
}
