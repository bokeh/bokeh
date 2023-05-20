import type flatpickr from "flatpickr"

import {BaseDatePicker, BaseDatePickerView, DateLike} from "./base_date_picker"
import type * as p from "core/properties"
import {assert} from "core/util/assert"

export class DatePickerView extends BaseDatePickerView {
  declare model: DatePicker

  protected override get flatpickr_options(): flatpickr.Options.Options {
    return {
      ...super.flatpickr_options,
      mode: "single",
    }
  }

  protected override _on_change(selected: Date[]): void {
    switch (selected.length) {
      case 0: {
        this.model.value = null
        break
      }
      case 1: {
        const [datetime] = selected
        const date = this._format_date(datetime)
        this.model.value = date
        break
      }
      default: {
        assert(false, "invalid length")
      }
    }
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
