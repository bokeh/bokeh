import type flatpickr from "flatpickr"

import {BaseDatetimePicker, BaseDatetimePickerView} from "./base_datetime_picker"
import {DateLike} from "./base_date_picker"
import {assert} from "core/util/assert"
import type * as p from "core/properties"

export class DatetimePickerView extends BaseDatetimePickerView {
  declare model: DatetimePicker

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

export namespace DatetimePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseDatetimePicker.Props & {
  }
}

export interface DatetimePicker extends DatetimePicker.Attrs {}

export class DatetimePicker extends BaseDatetimePicker {
  declare properties: DatetimePicker.Props
  declare __view_type__: DatetimePickerView

  declare value: DateLike | null

  constructor(attrs?: Partial<DatetimePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DatetimePickerView

    this.define<DatetimePicker.Props>(({Nullable}) => ({
      value: [ Nullable(DateLike), null ],
    }))
  }
}
