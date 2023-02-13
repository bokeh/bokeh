import flatpickr from "flatpickr"

import {BaseDatePicker, BaseDatePickerView, DateLike} from "./base_date_picker"
import * as p from "core/properties"
import {assert} from "core/util/assert"

export class DatePickerView extends BaseDatePickerView {
  declare model: DatePicker

  protected override get flatpickr_options(): flatpickr.Options.Options {
    return {
      ...super.flatpickr_options,
      mode: "single",
    }
  }

  protected _on_change(selected_dates: Date[], _date_string: string): void {
    assert(selected_dates.length == 1)
    this.model.value = this._format_date(selected_dates[0])
  }
}

export namespace DatePicker {
  export type Attrs = p.AttrsOf<Props>
  export type Props = BaseDatePicker.Props
}

export interface DatePicker extends DatePicker.Attrs {}

export class DatePicker extends BaseDatePicker {
  declare properties: DatePicker.Props
  declare __view_type__: DatePickerView

  declare value: DateLike | null

  constructor(attrs?: Partial<DatePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DatePickerView

    this.define<DatePicker.Props>(({Nullable}) => ({
      value: [ Nullable(DateLike), null ],
    }))
  }
}
