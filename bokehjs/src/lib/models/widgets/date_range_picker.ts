import type flatpickr from "flatpickr"

import {BaseDatePicker, BaseDatePickerView, DateLike} from "./base_date_picker"
import {unreachable} from "core/util/assert"
import type * as p from "core/properties"

export class DateRangePickerView extends BaseDatePickerView {
  declare model: DateRangePicker

  protected override get flatpickr_options(): flatpickr.Options.Options {
    const options = super.flatpickr_options
    options.mode = "range"

    options.onClose = (selected) => {
      this._on_close(selected)
    }

    return options
  }

  protected _on_close(selected: Date[]): void {
    switch (selected.length) {
      case 0:
      case 1: {
        // Incomplete selection, treat as no selection.
        this.model.value = null
        break
      }
      case 2:
        break
      default: {
        unreachable("invalid length")
      }
    }
  }

  protected override _on_change(selected: Date[]): void {
    switch (selected.length) {
      case 0:
        this.model.value = null
        break
      case 1: {
        // Selection in progress, so do nothing and wait for two selected
        // dates. Single date selection is still possible and represented
        // by [date, date] tuple.
        break
      }
      case 2: {
        const [from, to] = selected
        const from_date = this._format_date(from)
        const to_date = this._format_date(to)
        this.model.value = [from_date, to_date]
        break
      }
      default: {
        unreachable("invalid length")
      }
    }
  }
}

export namespace DateRangePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseDatePicker.Props
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

    this.define<DateRangePicker.Props>(({Tuple, Nullable}) => ({
      value: [ Nullable(Tuple(DateLike, DateLike)), null ],
    }))
  }
}
