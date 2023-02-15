import {DatePicker, DatePickerView} from "./date_picker"
import {DateLike} from "./base_date_picker"
import * as p from "core/properties"

export class DatetimeRangePickerView extends DatePickerView {
  declare model: DatetimeRangePicker
}

export namespace DatetimeRangePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DatePicker.Props & {
  }
}

export interface DatetimeRangePicker extends DatetimeRangePicker.Attrs {}

export class DatetimeRangePicker extends DatePicker {
  declare properties: DatetimeRangePicker.Props
  declare __view_type__: DatetimeRangePickerView

  declare value: DateLike | null

  constructor(attrs?: Partial<DatetimeRangePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DatetimeRangePickerView

    this.define<DatetimeRangePicker.Props>(() => ({
    }))
  }
}
