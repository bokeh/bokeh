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
    assert(selected.length <= 1)
    this.model.value = (() => {
      if (selected.length == 0) {
        return null
      } else {
        const [datetime] = selected
        return this._format_date(datetime)
      }
    })()
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
