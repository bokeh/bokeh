import flatpickr from "flatpickr"

import {BaseDatePicker, BaseDatePickerView} from "./base_date_picker"
import {TimeLike} from "./time_picker"
import * as p from "core/properties"

export abstract class BaseDatetimePickerView extends BaseDatePickerView {
  declare model: BaseDatetimePicker

  override connect_signals(): void {
    super.connect_signals()

    const {
      value, min_time, max_time, hour_increment,
      minute_increment, second_increment, seconds, am_pm,
    } = this.model.properties

    this.connect(value.change, () => {
      const {value} = this.model
      if (value != null) {
        this.picker.setDate(value)
      } else {
        this.picker.clear()
      }
    })
    this.connect(min_time.change, () => this.picker.set("minTime", this.model.min_time))
    this.connect(max_time.change, () => this.picker.set("maxTime", this.model.max_time))
    this.connect(hour_increment.change, () => this.picker.set("hourIncrement", this.model.hour_increment))
    this.connect(minute_increment.change, () => this.picker.set("minuteIncrement", this.model.minute_increment))
    this.connect(second_increment.change, () => this._update_second_increment())
    this.connect(seconds.change, () => this.picker.set("enableSeconds", this.model.seconds))
    this.connect(am_pm.change, () => this.picker.set("time_24hr", this.model.am_pm))
  }

  protected override get flatpickr_options(): flatpickr.Options.Options {
    const {min_time, max_time, hour_increment, minute_increment, seconds, am_pm} = this.model

    const options = super.flatpickr_options
    options.enableTime = true

    options.hourIncrement = hour_increment
    options.minuteIncrement = minute_increment
    options.enableSeconds = seconds
    options.time_24hr = !am_pm

    if (min_time != null) {
      options.minTime = min_time
    }
    if (max_time != null) {
      options.maxTime = max_time
    }

    return options
  }

  override render(): void {
    super.render()
    this._update_second_increment()
  }

  protected _update_second_increment(): void {
    const {second_increment} = this.model
    this.picker.secondElement?.setAttribute("step", second_increment.toString())
  }
}

export namespace BaseDatetimePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = BaseDatePicker.Props & {
    min_time: p.Property<TimeLike | null>
    max_time: p.Property<TimeLike | null>
    hour_increment: p.Property<number>
    minute_increment: p.Property<number>
    second_increment: p.Property<number>
    seconds: p.Property<boolean>
    am_pm: p.Property<boolean>
  }
}

export interface BaseDatetimePicker extends BaseDatetimePicker.Attrs {}

export abstract class BaseDatetimePicker extends BaseDatePicker {
  declare properties: BaseDatetimePicker.Props
  declare __view_type__: BaseDatetimePickerView

  constructor(attrs?: Partial<BaseDatetimePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.define<BaseDatetimePicker.Props>(({Boolean, Nullable, Positive, Int}) => ({
      min_time: [ Nullable(TimeLike), null ],
      max_time: [ Nullable(TimeLike), null ],
      hour_increment: [ Positive(Int), 1 ],
      minute_increment: [ Positive(Int), 1 ],
      second_increment: [ Positive(Int), 1 ],
      seconds: [ Boolean, false ],
      am_pm: [ Boolean, false ],
    }))

    this.override<BaseDatetimePicker.Props>({
      date_format: "Y-m-d H:i",
    })
  }
}
