import flatpickr from "flatpickr"

import {PickerBase, PickerBaseView} from "./picker_base"
import * as p from "core/properties"
import {isArray} from "core/util/types"
import {Or, Tuple, String, Array, Ref, Struct} from "core/kinds"

type DateLike = typeof DateLike["__type__"]
const DateLike = Or(Ref(Date), String)

type DateLikeList = typeof DateLikeList["__type__"]
const DateLikeList = Array(Or(DateLike, Tuple(DateLike, DateLike), Struct({from: DateLike, to: DateLike})))

export class DatePickerView extends PickerBaseView {
  declare model: DatePicker

  override connect_signals(): void {
    super.connect_signals()

    const {value, min_date, max_date, disabled_dates, enabled_dates, date_format} = this.model.properties
    this.connect(value.change, () => {
      const {value} = this.model
      if (value != null) {
        this._picker?.setDate(value)
      } else {
        this._picker?.clear()
      }
    })
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
    this.connect(date_format.change, () => this._picker?.set("dateFormat", this.model.date_format))
  }

  protected override get flatpickr_options(): flatpickr.Options.Options {
    const {value, min_date, max_date, disabled_dates, enabled_dates, date_format} = this.model

    const options = super.flatpickr_options

    options.onChange = (selected_dates, date_string, instance) => {
      this._on_change(selected_dates, date_string, instance)
    }

    if (value != null) {
      options.defaultDate = value
    }
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

    options.dateFormat = date_format

    return options
  }

  protected _on_change(_selected_dates: Date[], date_string: string, _instance: flatpickr.Instance): void {
    this.model.value = date_string
    this.change_input()
  }

  protected _convert_date_list(value: DateLikeList): flatpickr.Options.DateLimit[] {
    const result: flatpickr.Options.DateLimit[] = []
    for (const item of value) {
      if (isArray(item)) {
        const [from, to] = item
        result.push({from, to})
      } else {
        result.push(item)
      }
    }
    return result
  }
}

export namespace DatePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PickerBase.Props & {
    value:          p.Property<Date | string | null>
    min_date:       p.Property<Date | string | null>
    max_date:       p.Property<Date | string | null>
    disabled_dates: p.Property<DateLikeList | null>
    enabled_dates:  p.Property<DateLikeList | null>
    date_format:    p.Property<string>
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

    this.define<DatePicker.Props>(({Nullable}) => ({
      value:          [ Nullable(DateLike), null ],
      min_date:       [ Nullable(DateLike), null ],
      max_date:       [ Nullable(DateLike), null ],
      disabled_dates: [ Nullable(DateLikeList), null ],
      enabled_dates:  [ Nullable(DateLikeList), null ],
      date_format:    [ String, "Y-m-d" ],
    }))
  }
}
