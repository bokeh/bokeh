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
    assert(selected.length <= 1)
    this.model.value = (() => {
      if (selected.length == 0) {
        return null
      } else {
        const [datetime] = selected
        const date = this._format_date(datetime)
        return date
      }
    })()
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
