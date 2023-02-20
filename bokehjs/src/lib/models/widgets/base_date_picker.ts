import flatpickr from "flatpickr"

import {PickerBase, PickerBaseView} from "./picker_base"
import * as p from "core/properties"
import {isArray} from "core/util/types"
import {Or, Tuple, String, Array, Ref, Struct} from "core/kinds"

export type DateLike = typeof DateLike["__type__"]
export const DateLike = Or(Ref(Date), String)

export type DateLikeList = typeof DateLikeList["__type__"]
export const DateLikeList = Array(Or(DateLike, Tuple(DateLike, DateLike), Struct({from: DateLike, to: DateLike})))

export abstract class BaseDatePickerView extends PickerBaseView {
  declare model: BaseDatePicker

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
    this.connect(date_format.change, () => this._picker?.set("altFormat", this.model.date_format))
  }

  protected override get flatpickr_options(): flatpickr.Options.Options {
    const {value, min_date, max_date, disabled_dates, enabled_dates, date_format} = this.model

    const options = super.flatpickr_options

    options.altInput = true
    options.altFormat = date_format

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

    return options
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

  protected _format_date(date: Date): string {
    const {picker} = this
    return picker.formatDate(date, picker.config.dateFormat)
  }
}

export namespace BaseDatePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PickerBase.Props & {
    value:          p.Property<DateLike | DateLike[] | null>
    min_date:       p.Property<DateLike | null>
    max_date:       p.Property<DateLike | null>
    disabled_dates: p.Property<DateLikeList | null>
    enabled_dates:  p.Property<DateLikeList | null>
    date_format:    p.Property<string>
  }
}

export interface BaseDatePicker extends BaseDatePicker.Attrs {}

export abstract class BaseDatePicker extends PickerBase {
  declare properties: BaseDatePicker.Props
  declare __view_type__: BaseDatePickerView

  constructor(attrs?: Partial<BaseDatePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.define<BaseDatePicker.Props>(({Nullable}) => ({
      min_date:       [ Nullable(DateLike), null ],
      max_date:       [ Nullable(DateLike), null ],
      disabled_dates: [ Nullable(DateLikeList), null ],
      enabled_dates:  [ Nullable(DateLikeList), null ],
      date_format:    [ String, "Y-m-d" ],
    }))
  }
}
