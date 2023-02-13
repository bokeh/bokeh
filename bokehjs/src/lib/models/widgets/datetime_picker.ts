import {DatePicker, DatePickerView} from "./date_picker"
import {DateLike} from "./base_date_picker"
import * as p from "core/properties"

export class DatetimePickerView extends DatePickerView {
  declare model: DatetimePicker
}

export namespace DatetimePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DatePicker.Props & {
  }
}

export interface DatetimePicker extends DatetimePicker.Attrs {}

export class DatetimePicker extends DatePicker {
  declare properties: DatetimePicker.Props
  declare __view_type__: DatetimePickerView

  declare value: DateLike | null

  constructor(attrs?: Partial<DatetimePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DatetimePickerView

    this.define<DatetimePicker.Props>(() => ({
    }))
  }
}
