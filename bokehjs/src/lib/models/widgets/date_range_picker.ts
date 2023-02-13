import flatpickr from "flatpickr"

import {BaseDatePicker, BaseDatePickerView, DateLike} from "./base_date_picker"
import {assert} from "core/util/assert"
import * as p from "core/properties"

export class DateRangePickerView extends BaseDatePickerView {
  declare model: DateRangePicker

  protected override get flatpickr_options(): flatpickr.Options.Options {
    return {
      ...super.flatpickr_options,
      mode: "range",
      conjunction: this.model.conjunction,
    }
  }

  protected override _on_change(selected_dates: Date[], _date_string: string): void {
    switch (selected_dates.length) {
      case 0:
        this.model.value = null
        break
      case 1: {
        const [date] = selected_dates
        const date_str = this._format_date(date)
        this.model.value = [date_str, date_str]
        break
      }
      case 2: {
        const [from, to] = selected_dates
        const from_str = this._format_date(from)
        const to_str = this._format_date(to)
        this.model.value = [from_str, to_str]
        break
      }
      default: {
        assert(false, "invalid length")
      }
    }
  }
}

export namespace DateRangePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseDatePicker.Props & {
    conjunction: p.Property<string>
  }
}

export interface DateRangePicker extends DateRangePicker.Attrs {}

export class DateRangePicker extends BaseDatePicker {
  declare properties: DateRangePicker.Props
  declare __view_type__: DateRangePickerView

  declare value: [DateLike, DateLike] | null

  constructor(attrs?: Partial<DateRangePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DateRangePickerView

    this.define<DateRangePicker.Props>(({String, Tuple, Nullable}) => ({
      value: [ Nullable(Tuple(DateLike, DateLike)), null ],
      conjunction: [ String, " :: " ],
    }))
  }
}
