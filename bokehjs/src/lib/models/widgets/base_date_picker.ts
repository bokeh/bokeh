import type flatpickr from "flatpickr"

import {PickerBase, PickerBaseView} from "./picker_base"
import type * as p from "core/properties"
import {isArray} from "core/util/types"
import {Or, Tuple, Str, Float, List, Ref, Struct} from "core/kinds"

export type DateLike = typeof DateLike["__type__"]
export const DateLike = Or(Ref(Date), Str, Float)

export type DateLikeList = typeof DateLikeList["__type__"]
export const DateLikeList = List(Or(DateLike, Tuple(DateLike, DateLike), Struct({from: DateLike, to: DateLike})))

export abstract class BaseDatePickerView extends PickerBaseView {
  declare model: BaseDatePicker

  protected _format_date(date: Date): string {
    const {picker} = this
    return picker.formatDate(date, picker.config.dateFormat)
  }

  override connect_signals(): void {
    super.connect_signals()

    const {value, min_date, max_date, disabled_dates, enabled_dates, date_format} = this.model.properties
    this.connect(value.change, () => {
      const {value} = this.model
      if (value != null) {
        this.picker.setDate(value)
      } else {
        this.picker.clear()
      }
    })
    this.connect(min_date.change, () => this.picker.set("minDate", this.model.min_date))
    this.connect(max_date.change, () => this.picker.set("maxDate", this.model.max_date))
    this.connect(disabled_dates.change, () => {
      const {disabled_dates} = this.model
      this.picker.set("disable", disabled_dates != null ? this._convert_date_list(disabled_dates) : [])
    })
    this.connect(enabled_dates.change, () => {
      const {enabled_dates} = this.model
      if (enabled_dates != null) {
        this.picker.set("enable", this._convert_date_list(enabled_dates))
      } else {
        // this reimplements `set()` for the `undefined` case
        this.picker.config._enable = undefined
        this.picker.redraw()
        this.picker.updateValue(true)
      }
    })
    this.connect(date_format.change, () => this.picker.set("altFormat", this.model.date_format))
  }

  protected override get flatpickr_options(): flatpickr.Options.Options {
    const {value, min_date, max_date, disabled_dates, enabled_dates, date_format} = this.model

    const options = super.flatpickr_options

    options.altInput = true
    options.altFormat = date_format
    options.dateFormat = "Y-m-d"

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
      date_format:    [ Str, "Y-m-d" ],
    }))
  }
}
