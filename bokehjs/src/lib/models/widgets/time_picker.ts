import flatpickr from "flatpickr"

import {PickerBase, PickerBaseView} from "./picker_base"
import {String} from "core/kinds"
import * as p from "core/properties"
import {assert} from "core/util/assert"

export type TimeLike = typeof TimeLike["__type__"]
export const TimeLike = String

export class TimePickerView extends PickerBaseView {
  declare model: TimePicker

  protected _format_time(date: Date): string {
    const {picker} = this
    return picker.formatDate(date, picker.config.dateFormat)
  }

  override connect_signals(): void {
    super.connect_signals()

    const {
      value, min_time, max_time, time_format, hour_increment,
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
    this.connect(time_format.change, () => this.picker.set("altFormat", this.model.time_format))
    this.connect(hour_increment.change, () => this.picker.set("hourIncrement", this.model.hour_increment))
    this.connect(minute_increment.change, () => this.picker.set("minuteIncrement", this.model.minute_increment))
    this.connect(second_increment.change, () => this._update_second_increment())
    this.connect(seconds.change, () => this.picker.set("enableSeconds", this.model.seconds))
    this.connect(am_pm.change, () => this.picker.set("time_24hr", this.model.am_pm))
  }

  protected override get flatpickr_options(): flatpickr.Options.Options {
    const {value, min_time, max_time, time_format, hour_increment, minute_increment, seconds, am_pm} = this.model

    const options = super.flatpickr_options

    options.enableTime = true
    options.noCalendar = true

    options.altInput = true
    options.altFormat = time_format
    options.dateFormat = "H:i:S"

    options.hourIncrement = hour_increment
    options.minuteIncrement = minute_increment
    options.enableSeconds = seconds
    options.time_24hr = !am_pm

    if (value != null) {
      options.defaultDate = value
    }
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
    this.picker.secondElement!.setAttribute("step", second_increment.toString())
  }

  protected _on_change(selected: Date[]): void {
    switch (selected.length) {
      case 0: {
        this.model.value = null
        break
      }
      case 1: {
        const [datetime] = selected
        const time = this._format_time(datetime)
        this.model.value = time
        break
      }
      default: {
        assert(false, "invalid length")
      }
    }
  }
}

export namespace TimePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = PickerBase.Props & {
    value: p.Property<TimeLike | null>
    min_time: p.Property<TimeLike | null>
    max_time: p.Property<TimeLike | null>
    time_format: p.Property<string>
    hour_increment: p.Property<number>
    minute_increment: p.Property<number>
    second_increment: p.Property<number>
    seconds: p.Property<boolean>
    am_pm: p.Property<boolean>
  }
}

export interface TimePicker extends TimePicker.Attrs {}

export class TimePicker extends PickerBase {
  declare properties: TimePicker.Props
  declare __view_type__: TimePickerView

  constructor(attrs?: Partial<TimePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = TimePickerView

    this.define<TimePicker.Props>(({Boolean, String, Nullable, Positive, Int}) => ({
      value: [ Nullable(TimeLike), null ],
      min_time: [ Nullable(TimeLike), null ],
      max_time: [ Nullable(TimeLike), null ],
      time_format: [ String, "H:i" ],
      hour_increment: [ Positive(Int), 1 ],
      minute_increment: [ Positive(Int), 1 ],
      second_increment: [ Positive(Int), 1 ],
      seconds: [ Boolean, false ],
      am_pm: [ Boolean, false ],
    }))
  }
}
