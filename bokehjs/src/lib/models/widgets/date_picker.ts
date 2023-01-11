import flatpickr from "flatpickr"

import {PickerBase, PickerBaseView} from "./picker_base"
import * as p from "core/properties"
import {isString} from "core/util/types"
import {Or, Tuple, String, Array} from "core/kinds"

type DateStr = typeof DateStr["__type__"]
const DateStr = String

type DatesList = typeof DatesList["__type__"]
const DatesList = Array(Or(DateStr, Tuple(DateStr, DateStr)))

export class DatePickerView extends PickerBaseView {
  declare model: DatePicker

  override connect_signals(): void {
    super.connect_signals()

    const {value, min_date, max_date, disabled_dates, enabled_dates} = this.model.properties
    this.connect(value.change, () => this._picker?.setDate(this.model.value))
    this.connect(min_date.change, () => this._picker?.set("minDate", this.model.min_date))
    this.connect(max_date.change, () => this._picker?.set("maxDate", this.model.max_date))
    this.connect(disabled_dates.change, () => {
      const {disabled_dates} = this.model
      this._picker?.set("disable", disabled_dates != null ? this._convert_date_list(disabled_dates) : undefined)
    })
    this.connect(enabled_dates.change, () => {
      const {enabled_dates} = this.model
      this._picker?.set("enable", enabled_dates != null ? this._convert_date_list(enabled_dates) : undefined)
    })
  }

  protected override get flatpickr_options(): flatpickr.Options.Options {
    const {value, min_date, max_date, disabled_dates, enabled_dates} = this.model

    const options = super.flatpickr_options

    options.defaultDate = value
    options.onChange = (selected_dates, date_string, instance) => this._on_change(selected_dates, date_string, instance)

    if (min_date != null) {
      options.minDate = min_date
    }
    if (max_date != null) {
      options.maxDate = max_date
    }
    if (disabled_dates != null) {
      options.disable = this._convert_date_list(disabled_dates)
    }
    if (enabled_dates != null) {
      options.enable = this._convert_date_list(enabled_dates)
    }

    return options
  }

  protected _on_change(_selected_dates: Date[], date_string: string, _instance: flatpickr.Instance): void {
    this.model.value = date_string
    this.change_input()
  }

  protected _convert_date_list(value: DatesList): flatpickr.Options.DateLimit[] {
    const result: flatpickr.Options.DateLimit[] = []
    for (const item of value) {
      if (isString(item))
        result.push(item)
      else {
        const [from, to] = item
        result.push({from, to})
      }
    }
    return result
  }
}

export namespace DatePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PickerBase.Props & {
    value:          p.Property<string>
    min_date:       p.Property<string | null>
    max_date:       p.Property<string | null>
    disabled_dates: p.Property<DatesList | null>
    enabled_dates:  p.Property<DatesList | null>
  }
}

export interface DatePicker extends DatePicker.Attrs {}

export class DatePicker extends PickerBase {
  declare properties: DatePicker.Props
  declare __view_type__: DatePickerView

  constructor(attrs?: Partial<DatePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DatePickerView

    this.define<DatePicker.Props>(({String, Nullable}) => ({
      value:          [ String ],
      min_date:       [ Nullable(String), null ],
      max_date:       [ Nullable(String), null ],
      disabled_dates: [ Nullable(DatesList), null ],
      enabled_dates:  [ Nullable(DatesList), null ],
    }))
  }
}
