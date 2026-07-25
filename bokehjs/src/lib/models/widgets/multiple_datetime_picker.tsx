import type flatpickr from "flatpickr"

import {BaseDatetimePicker, BaseDatetimePickerView} from "./base_datetime_picker"
import {DateLike} from "./base_date_picker"
import type * as p from "core/properties"

export class MultipleDatetimePickerView extends BaseDatetimePickerView {
  declare model: MultipleDatetimePicker

  protected override get flatpickr_options(): flatpickr.Options.Options {
    return {
      ...super.flatpickr_options,
      mode: "multiple",
      conjunction: this.model.separator,
    }
  }

  protected override _on_change(selected: Date[]): void {
    this.model.value = selected.map((datetime) => this._format_date(datetime))
  }
}

export namespace MultipleDatetimePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseDatetimePicker.Props & {
    separator: p.Property<string>
  }
}

export interface MultipleDatetimePicker extends MultipleDatetimePicker.Attrs {}

export class MultipleDatetimePicker extends BaseDatetimePicker {
  declare properties: MultipleDatetimePicker.Props
  declare __view_type__: MultipleDatetimePickerView

  declare value: DateLike[]

  constructor(attrs?: Partial<MultipleDatetimePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = MultipleDatetimePickerView

    this.define<MultipleDatetimePicker.Props>(({Str, List}) => ({
      value: [ List(DateLike), [] ],
      separator: [ Str, ", " ],
    }))
  }
}
