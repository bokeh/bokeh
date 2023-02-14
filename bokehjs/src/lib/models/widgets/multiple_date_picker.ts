import flatpickr from "flatpickr"

import {BaseDatePicker, BaseDatePickerView, DateLike} from "./base_date_picker"
import * as p from "core/properties"

export class MultipleDatePickerView extends BaseDatePickerView {
  declare model: MultipleDatePicker

  protected override get flatpickr_options(): flatpickr.Options.Options {
    return {
      ...super.flatpickr_options,
      mode: "multiple",
      conjunction: this.model.separator,
    }
  }

  protected override _on_change(selected_dates: Date[], _date_string: string): void {
    this.model.value = selected_dates.map((date) => this._format_date(date))
  }
}

export namespace MultipleDatePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseDatePicker.Props & {
    separator: p.Property<string>
  }
}

export interface MultipleDatePicker extends MultipleDatePicker.Attrs {}

export class MultipleDatePicker extends BaseDatePicker {
  declare properties: MultipleDatePicker.Props
  declare __view_type__: MultipleDatePickerView

  declare value: DateLike[]

  constructor(attrs?: Partial<MultipleDatePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MultipleDatePickerView

    this.define<MultipleDatePicker.Props>(({String, Array}) => ({
      value: [ Array(DateLike), [] ],
      separator: [ String, ", " ],
    }))
  }
}
